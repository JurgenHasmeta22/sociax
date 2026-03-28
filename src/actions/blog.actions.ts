"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

function slugify(text: string) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function randomSuffix() {
	return Math.random().toString(36).slice(2, 8);
}

function extractExcerpt(content: string, maxLen = 200): string {
	// content is JSON from Tiptap; extract plain text
	try {
		const parsed = JSON.parse(content) as {
			content?: { content?: { text?: string }[] }[];
		};
		const texts: string[] = [];
		function walk(node: unknown) {
			if (!node || typeof node !== "object") return;
			const n = node as Record<string, unknown>;
			if (n.type === "text" && typeof n.text === "string")
				texts.push(n.text);
			if (Array.isArray(n.content))
				(n.content as unknown[]).forEach(walk);
		}
		walk(parsed);
		const joined = texts.join(" ").trim();
		return joined.length > maxLen ? joined.slice(0, maxLen) + "…" : joined;
	} catch {
		return content.slice(0, maxLen);
	}
}

export async function createBlog(data: {
	title: string;
	content: string;
	coverImageUrl?: string;
	published?: boolean;
	hashtags?: string[];
}) {
	const userId = await getSessionUserId();
	if (!data.title.trim()) throw new Error("Title is required");
	if (!data.content.trim()) throw new Error("Content is required");

	const base = slugify(data.title) || "blog";
	const slug = `${base}-${randomSuffix()}`;
	const excerpt = extractExcerpt(data.content);

	const blog = await prisma.$transaction(async (tx) => {
		const created = await tx.blog.create({
			data: {
				title: data.title.trim(),
				slug,
				content: data.content,
				excerpt,
				coverImageUrl: data.coverImageUrl?.trim() || null,
				published: data.published ?? false,
				authorId: userId,
			},
		});

		const explicitTags = (data.hashtags ?? [])
			.map((t) => t.toLowerCase().replace(/^#/, "").trim())
			.filter(Boolean);
		const allTags = [...new Set(explicitTags)];

		for (const name of allTags) {
			if (!name) continue;
			let tag = await tx.hashtag.findUnique({ where: { name } });
			if (!tag) tag = await tx.hashtag.create({ data: { name } });
			await tx.blogHashtag.upsert({
				where: {
					blogId_hashtagId: { blogId: created.id, hashtagId: tag.id },
				},
				create: { blogId: created.id, hashtagId: tag.id },
				update: {},
			});
		}

		return created;
	});

	revalidatePath("/blog");
	return { slug: blog.slug, id: blog.id };
}

export async function updateBlog(
	id: number,
	data: {
		title?: string;
		content?: string;
		coverImageUrl?: string;
		published?: boolean;
		hashtags?: string[];
	},
) {
	const userId = await getSessionUserId();
	const blog = await prisma.blog.findUnique({ where: { id } });
	if (!blog) throw new Error("Blog not found");
	if (blog.authorId !== userId) throw new Error("Unauthorized");

	const excerpt = data.content ? extractExcerpt(data.content) : undefined;

	await prisma.$transaction(async (tx) => {
		await tx.blog.update({
			where: { id },
			data: {
				title: data.title?.trim() ?? blog.title,
				content: data.content ?? blog.content,
				excerpt: excerpt ?? blog.excerpt,
				coverImageUrl:
					data.coverImageUrl !== undefined
						? data.coverImageUrl?.trim() || null
						: blog.coverImageUrl,
				published: data.published ?? blog.published,
			},
		});

		if (data.hashtags !== undefined) {
			// Replace all hashtags
			await tx.blogHashtag.deleteMany({ where: { blogId: id } });
			const tags = data.hashtags
				.map((t) => t.toLowerCase().replace(/^#/, "").trim())
				.filter(Boolean);
			for (const name of [...new Set(tags)]) {
				if (!name) continue;
				let tag = await tx.hashtag.findUnique({ where: { name } });
				if (!tag) tag = await tx.hashtag.create({ data: { name } });
				await tx.blogHashtag.create({
					data: { blogId: id, hashtagId: tag.id },
				});
			}
		}
	});

	revalidatePath(`/blog/${blog.slug}`);
	revalidatePath("/blog");
	return { slug: blog.slug };
}

export async function deleteBlog(id: number) {
	const userId = await getSessionUserId();
	const blog = await prisma.blog.findUnique({ where: { id } });
	if (!blog) throw new Error("Blog not found");
	if (blog.authorId !== userId) throw new Error("Unauthorized");

	await prisma.blog.update({
		where: { id },
		data: { isDeleted: true, published: false },
	});
	revalidatePath("/blog");
}

export async function getAllBlogs(page = 1) {
	const take = 20;
	const skip = (page - 1) * take;

	const blogs = await prisma.blog.findMany({
		where: { published: true, isDeleted: false },
		orderBy: { createdAt: "desc" },
		take: take + 1,
		skip,
		include: {
			author: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			hashtags: { include: { hashtag: true } },
			_count: { select: { likes: true } },
		},
	});

	const hasMore = blogs.length > take;
	return { blogs: hasMore ? blogs.slice(0, take) : blogs, hasMore };
}

export async function getBlogBySlug(slug: string) {
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const blog = await prisma.blog.findUnique({
		where: { slug, isDeleted: false },
		include: {
			author: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			hashtags: { include: { hashtag: true } },
			_count: { select: { likes: true } },
		},
	});

	if (!blog) return null;

	const isLiked = currentUserId
		? !!(await prisma.blogLike.findUnique({
				where: {
					userId_blogId: { userId: currentUserId, blogId: blog.id },
				},
			}))
		: false;

	const isAuthor = currentUserId === blog.authorId;

	return { ...blog, isLiked, isAuthor };
}

export async function getBlogsByAuthor(
	userId: number,
	includeUnpublished = false,
) {
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;
	const showUnpublished = includeUnpublished && currentUserId === userId;

	return prisma.blog.findMany({
		where: {
			authorId: userId,
			isDeleted: false,
			...(showUnpublished ? {} : { published: true }),
		},
		orderBy: { createdAt: "desc" },
		include: {
			hashtags: { include: { hashtag: true } },
			_count: { select: { likes: true } },
		},
	});
}

export async function toggleBlogLike(blogId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.blogLike.findUnique({
		where: { userId_blogId: { userId, blogId } },
	});

	if (existing) {
		await prisma.blogLike.delete({
			where: { userId_blogId: { userId, blogId } },
		});
		return { liked: false };
	} else {
		await prisma.blogLike.create({ data: { userId, blogId } });
		return { liked: true };
	}
}

export async function getBlogLikers(blogId: number) {
	const likers = await prisma.blogLike.findMany({
		where: { blogId },
		orderBy: { createdAt: "desc" },
		select: {
			user: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
		},
	});
	return likers.map((l) => l.user);
}

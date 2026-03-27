"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { PageCategory, ReactionType } from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

function toSlug(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function createPage(
	name: string,
	description: string,
	category: PageCategory,
	website: string,
) {
	const userId = await getSessionUserId();
	if (!name.trim()) throw new Error("Name is required");

	let slug = toSlug(name.trim());
	const existing = await prisma.page.findUnique({ where: { slug } });
	if (existing) slug = `${slug}-${Date.now()}`;

	const page = await prisma.page.create({
		data: {
			name: name.trim(),
			slug,
			description: description.trim() || null,
			category,
			website: website.trim() || null,
			ownerId: userId,
		},
	});

	revalidatePath("/pages");
	return page;
}

export async function followPage(pageId: number) {
	const userId = await getSessionUserId();

	await prisma.pageFollower.upsert({
		where: { userId_pageId: { userId, pageId } },
		create: { userId, pageId },
		update: {},
	});

	revalidatePath("/pages");
}

export async function unfollowPage(pageId: number) {
	const userId = await getSessionUserId();
	await prisma.pageFollower.deleteMany({ where: { userId, pageId } });
	revalidatePath("/pages");
}

const PAGES_LIMIT = 20;

export async function fetchPages(skip: number, query: string) {
	const userId = await getSessionUserId();

	const where = query.trim()
		? {
				isActive: true,
				OR: [
					{ name: { contains: query.trim() } },
					{ description: { contains: query.trim() } },
				],
			}
		: { isActive: true };

	const [pages, total, myFollows] = await Promise.all([
		prisma.page.findMany({
			where,
			skip,
			take: PAGES_LIMIT,
			orderBy: { createdAt: "desc" },
			include: {
				_count: { select: { followers: true, posts: true } },
			},
		}),
		prisma.page.count({ where }),
		prisma.pageFollower.findMany({
			where: { userId },
			select: { pageId: true },
		}),
	]);

	const followed = new Set(myFollows.map((f) => f.pageId));
	return {
		pages: pages.map((p) => ({ ...p, isFollowing: followed.has(p.id) })),
		total,
		hasMore: skip + PAGES_LIMIT < total,
	};
}

export async function createPagePost(
	pageId: number,
	content: string,
	mediaUrl?: string,
) {
	const userId = await getSessionUserId();

	const page = await prisma.page.findUnique({ where: { id: pageId } });
	if (!page || page.ownerId !== userId) throw new Error("Forbidden");

	await prisma.pagePost.create({
		data: {
			pageId,
			userId,
			content: content.trim() || null,
			mediaUrl: mediaUrl?.trim() || null,
		},
	});

	revalidatePath(`/pages/${page.slug}`);
}

export async function deletePagePost(postId: number, pageSlug: string) {
	const userId = await getSessionUserId();

	const post = await prisma.pagePost.findUnique({ where: { id: postId } });
	if (!post || post.userId !== userId) throw new Error("Forbidden");

	await prisma.pagePost.update({
		where: { id: postId },
		data: { isDeleted: true },
	});

	revalidatePath(`/pages/${pageSlug}`);
}

export async function togglePagePostLike(
	postId: number,
	reactionType: ReactionType,
) {
	const userId = await getSessionUserId();

	const existing = await prisma.pagePostLike.findUnique({
		where: { userId_pagePostId: { userId, pagePostId: postId } },
	});

	if (existing) {
		if (existing.reactionType === reactionType) {
			await prisma.pagePostLike.delete({
				where: { userId_pagePostId: { userId, pagePostId: postId } },
			});
		} else {
			await prisma.pagePostLike.update({
				where: { userId_pagePostId: { userId, pagePostId: postId } },
				data: { reactionType },
			});
		}
	} else {
		await prisma.pagePostLike.create({
			data: { userId, pagePostId: postId, reactionType },
		});
	}
}

export async function getPagePostReactions(postId: number) {
	return prisma.pagePostLike.findMany({
		where: { pagePostId: postId },
		orderBy: { createdAt: "desc" },
		include: {
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
}

export async function createPagePostComment(postId: number, content: string) {
	const userId = await getSessionUserId();
	if (!content.trim()) return;

	await prisma.pagePostComment.create({
		data: { pagePostId: postId, userId, content: content.trim() },
	});
}

export async function deletePagePostComment(commentId: number) {
	const userId = await getSessionUserId();

	const comment = await prisma.pagePostComment.findUnique({
		where: { id: commentId },
	});
	if (!comment || comment.userId !== userId) throw new Error("Forbidden");

	await prisma.pagePostComment.update({
		where: { id: commentId },
		data: { isDeleted: true },
	});
}

export async function getPagePostComments(postId: number, currentUserId?: number) {
	const comments = await prisma.pagePostComment.findMany({
		where: { pagePostId: postId, isDeleted: false },
		orderBy: { createdAt: "asc" },
		include: {
			user: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			_count: { select: { likes: true } },
			likes: currentUserId
				? { where: { userId: currentUserId }, select: { id: true } }
				: false,
		},
	});

	return comments.map((c) => ({
		...c,
		likeCount: c._count.likes,
		isLikedByMe: currentUserId ? c.likes.length > 0 : false,
		likes: undefined,
		_count: undefined,
	}));
}

export async function togglePagePostCommentLike(commentId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.pagePostCommentLike.findUnique({
		where: { userId_pagePostCommentId: { userId, pagePostCommentId: commentId } },
	});

	if (existing) {
		await prisma.pagePostCommentLike.delete({
			where: { userId_pagePostCommentId: { userId, pagePostCommentId: commentId } },
		});
	} else {
		await prisma.pagePostCommentLike.create({
			data: { userId, pagePostCommentId: commentId },
		});
	}
}

const FOLLOWERS_LIMIT = 20;

export async function getPageFollowers(pageId: number, skip: number) {
	const [followers, total] = await Promise.all([
		prisma.pageFollower.findMany({
			where: { pageId },
			skip,
			take: FOLLOWERS_LIMIT,
			orderBy: { createdAt: "desc" },
			include: {
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
		}),
		prisma.pageFollower.count({ where: { pageId } }),
	]);

	return {
		followers: followers.map((f) => f.user),
		total,
		hasMore: skip + FOLLOWERS_LIMIT < total,
	};
}

export async function getPageBySlug(
	slug: string,
	currentUserId: number | null,
) {
	const page = await prisma.page.findUnique({
		where: { slug },
		include: {
			owner: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			_count: { select: { followers: true, posts: true } },
		},
	});

	if (!page) return null;

	const isFollowing = currentUserId
		? !!(await prisma.pageFollower.findUnique({
				where: {
					userId_pageId: { userId: currentUserId, pageId: page.id },
				},
			}))
		: false;

	return { ...page, isFollowing };
}

export async function fetchPagePosts(
	pageId: number,
	currentUserId: number | null,
) {
	const posts = await prisma.pagePost.findMany({
		where: { pageId, isDeleted: false },
		orderBy: { createdAt: "desc" },
		take: 20,
		include: {
			user: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			likes: {
				select: { userId: true, reactionType: true },
			},
			comments: {
				where: { isDeleted: false },
				take: 3,
				orderBy: { createdAt: "desc" },
				select: { id: true, content: true, userId: true },
			},
			_count: { select: { likes: true, comments: true } },
		},
	});

	const myLikes = currentUserId
		? new Set(
				posts
					.flatMap((p) => p.likes)
					.filter((l) => l.userId === currentUserId)
					.map(
						(l) =>
							posts.find((p) =>
								p.likes.some(
									(pl) =>
										pl.userId === l.userId &&
										pl.reactionType === l.reactionType,
								),
							)?.id,
					)
					.filter(Boolean),
			)
		: new Set<number>();

	return { posts, myLikes };
}

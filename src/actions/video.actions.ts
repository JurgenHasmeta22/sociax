"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PostPrivacy } from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function getVideos(opts?: {
	filter?: "all" | "mine" | "friends";
	page?: number;
}) {
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;
	const { filter = "all", page = 1 } = opts ?? {};
	const take = 24;
	const skip = (page - 1) * take;

	let friendIds: number[] = [];
	if (filter === "friends" && currentUserId) {
		const follows = await prisma.userFollow.findMany({
			where: { followerId: currentUserId, state: "accepted" },
			select: { followingId: true },
		});
		friendIds = follows.map((f) => f.followingId);
	}

	const videos = await prisma.video.findMany({
		where: {
			isDeleted: false,
			privacy: filter === "mine" ? undefined : "Public",
			...(filter === "mine" && currentUserId ? { authorId: currentUserId } : {}),
			...(filter === "friends" ? { authorId: { in: friendIds } } : {}),
		},
		orderBy: { createdAt: "desc" },
		take,
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
			_count: { select: { likes: true, comments: true } },
		},
	});

	return videos;
}

export async function getVideoById(id: number) {
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const video = await prisma.video.findUnique({
		where: { id, isDeleted: false },
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
			comments: {
				where: { isDeleted: false },
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
				},
			},
			_count: { select: { likes: true, comments: true } },
		},
	});

	if (!video) return null;

	const isLiked = currentUserId
		? !!(await prisma.videoLike.findUnique({ where: { userId_videoId: { userId: currentUserId, videoId: id } } }))
		: false;

	return { ...video, isLiked };
}

export async function createVideo(data: {
	title: string;
	description?: string;
	url: string;
	thumbnailUrl?: string;
	duration?: number;
	privacy?: PostPrivacy;
	hashtags?: string[];
}) {
	const userId = await getSessionUserId();
	if (!data.title.trim()) throw new Error("Title is required");
	if (!data.url.trim()) throw new Error("Video URL is required");

	const video = await prisma.$transaction(async (tx) => {
		const created = await tx.video.create({
			data: {
				title: data.title.trim(),
				description: data.description?.trim() || null,
				url: data.url.trim(),
				thumbnailUrl: data.thumbnailUrl?.trim() || null,
				duration: data.duration ?? null,
				privacy: data.privacy ?? "Public",
				authorId: userId,
			},
		});

		// Extract hashtags from title + description + explicit
		const textTags = ((data.title || "") + " " + (data.description || "")).match(/#[\w]+/g) ?? [];
		const explicitTags = (data.hashtags ?? []).map((t) => t.toLowerCase().replace(/^#/, "").trim()).filter(Boolean);
		const allTags = [...new Set([...textTags.map((t) => t.slice(1).toLowerCase()), ...explicitTags])];

		for (const name of allTags) {
			if (!name) continue;
			let tag = await tx.hashtag.findUnique({ where: { name } });
			if (!tag) tag = await tx.hashtag.create({ data: { name } });
			await tx.videoHashtag.upsert({
				where: { videoId_hashtagId: { videoId: created.id, hashtagId: tag.id } },
				create: { videoId: created.id, hashtagId: tag.id },
				update: {},
			});
		}

		return created;
	});

	revalidatePath("/videos");
	return video;
}

export async function deleteVideo(id: number) {
	const userId = await getSessionUserId();
	const video = await prisma.video.findUnique({ where: { id } });
	if (!video) throw new Error("Video not found");
	if (video.authorId !== userId) throw new Error("Unauthorized");

	await prisma.video.update({ where: { id }, data: { isDeleted: true } });
	revalidatePath("/videos");
}

export async function toggleVideoLike(videoId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.videoLike.findUnique({
		where: { userId_videoId: { userId, videoId } },
	});

	if (existing) {
		await prisma.videoLike.delete({ where: { userId_videoId: { userId, videoId } } });
		return { liked: false };
	} else {
		await prisma.videoLike.create({ data: { userId, videoId } });
		return { liked: true };
	}
}

export async function addVideoComment(videoId: number, content: string) {
	const userId = await getSessionUserId();
	if (!content.trim()) throw new Error("Comment cannot be empty");

	const comment = await prisma.videoComment.create({
		data: { videoId, userId, content: content.trim() },
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

	return comment;
}

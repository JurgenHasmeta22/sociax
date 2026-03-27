"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type {
	ReactionType,
	PostPrivacy,
} from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function togglePostLike(
	postId: number,
	reactionType: ReactionType,
) {
	const userId = await getSessionUserId();

	const existing = await prisma.postLike.findUnique({
		where: { userId_postId: { userId, postId } },
	});

	if (existing) {
		if (existing.reactionType === reactionType) {
			await prisma.postLike.delete({
				where: { userId_postId: { userId, postId } },
			});
		} else {
			await prisma.postLike.update({
				where: { userId_postId: { userId, postId } },
				data: { reactionType },
			});
		}
	} else {
		await prisma.postLike.create({
			data: { userId, postId, reactionType },
		});
	}

	revalidatePath("/feed");
}

export async function deletePost(postId: number) {
	const userId = await getSessionUserId();

	const post = await prisma.post.findUnique({ where: { id: postId } });
	if (!post || post.userId !== userId) throw new Error("Forbidden");

	await prisma.post.update({
		where: { id: postId },
		data: { isDeleted: true },
	});
	revalidatePath("/feed");
}

export async function getComments(postId: number) {
	const comments = await prisma.postComment.findMany({
		where: { postId, isDeleted: false },
		orderBy: { createdAt: "asc" },
		include: {
			user: { include: { avatar: true } },
			likes: { select: { userId: true, reactionType: true } },
		},
	});
	return comments;
}

export async function createComment(postId: number, content: string, mediaUrl?: string) {
	const userId = await getSessionUserId();
	if (!content.trim() && !mediaUrl) return;

	await prisma.postComment.create({
		data: { postId, userId, content: content.trim(), ...(mediaUrl ? { mediaUrl } : {}) },
	});
	revalidatePath("/feed");
}

export async function deleteComment(commentId: number) {
	const userId = await getSessionUserId();

	const comment = await prisma.postComment.findUnique({
		where: { id: commentId },
	});
	if (!comment || comment.userId !== userId) throw new Error("Forbidden");

	await prisma.postComment.update({
		where: { id: commentId },
		data: { isDeleted: true },
	});
	revalidatePath("/feed");
}

export async function toggleCommentLike(commentId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.commentLike.findUnique({
		where: { userId_commentId: { userId, commentId } },
	});

	if (existing) {
		await prisma.commentLike.delete({
			where: { userId_commentId: { userId, commentId } },
		});
	} else {
		await prisma.commentLike.create({ data: { userId, commentId } });
	}
}

export async function getPostReactions(postId: number) {
	const likes = await prisma.postLike.findMany({
		where: { postId },
		orderBy: { createdAt: "desc" },
		include: {
			user: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: true,
				},
			},
		},
	});
	return likes;
}

export async function togglePostSave(postId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.postSave.findUnique({
		where: { userId_postId: { userId, postId } },
	});

	if (existing) {
		await prisma.postSave.delete({
			where: { userId_postId: { userId, postId } },
		});
		revalidatePath("/saved");
		return false;
	} else {
		await prisma.postSave.create({ data: { userId, postId } });
		revalidatePath("/saved");
		return true;
	}
}

const SAVED_LIMIT = 20;

export async function fetchSavedPosts(skip: number) {
	const userId = await getSessionUserId();

	const saves = await prisma.postSave.findMany({
		where: { userId, post: { isDeleted: false } },
		skip,
		take: SAVED_LIMIT,
		orderBy: { createdAt: "desc" },
		include: {
			post: {
				include: {
					user: { include: { avatar: true } },
					media: { orderBy: { order: "asc" } },
					likes: {
						select: { id: true, userId: true, reactionType: true },
					},
					saves: { where: { userId }, select: { id: true } },
					_count: { select: { comments: true, shares: true } },
					hashtags: { include: { hashtag: true } },
				},
			},
		},
	});

	return saves.map((s) => s.post);
}

export async function createPost(
	content: string,
	privacy: PostPrivacy = "Public",
	mediaUrls: string[] = [],
) {
	const userId = await getSessionUserId();
	if (!content.trim() && mediaUrls.length === 0) return;

	const hashtagMatches = content.match(/#[\w]+/g) ?? [];
	const hashtagNames = [
		...new Set(hashtagMatches.map((h) => h.slice(1).toLowerCase())),
	];

	await prisma.$transaction(async (tx) => {
		const post = await tx.post.create({
			data: {
				content: content.trim() || null,
				privacy,
				userId,
				media: {
					create: mediaUrls.map((url, i) => ({
						url,
						type: "Image" as const,
						order: i,
					})),
				},
			},
		});

		for (const name of hashtagNames) {
			const hashtag = await tx.hashtag.upsert({
				where: { name },
				create: { name },
				update: {},
			});
			await tx.postHashtag.create({
				data: { postId: post.id, hashtagId: hashtag.id },
			});
		}
	});

	revalidatePath("/feed");
	revalidatePath("/profile", "layout");
}

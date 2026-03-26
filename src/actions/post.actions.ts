"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { ReactionType } from "../../prisma/generated/prisma";

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

export async function createComment(postId: number, content: string) {
	const userId = await getSessionUserId();
	if (!content.trim()) return;

	await prisma.postComment.create({
		data: { postId, userId, content: content.trim() },
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

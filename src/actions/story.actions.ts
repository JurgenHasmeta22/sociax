"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type {
	StoryPrivacy,
	ReactionType,
} from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function createStory(
	mediaUrl: string,
	caption: string,
	privacy: StoryPrivacy = "FriendsOnly",
) {
	const userId = await getSessionUserId();
	if (!mediaUrl.trim()) throw new Error("Media URL is required");

	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

	await prisma.story.create({
		data: {
			mediaUrl: mediaUrl.trim(),
			caption: caption.trim() || null,
			privacy,
			userId,
			expiresAt,
		},
	});

	revalidatePath("/feed");
}

export async function deleteStory(storyId: number) {
	const userId = await getSessionUserId();

	const story = await prisma.story.findUnique({ where: { id: storyId } });
	if (!story || story.userId !== userId) throw new Error("Forbidden");

	await prisma.story.delete({ where: { id: storyId } });
	revalidatePath("/feed");
}

export async function markStoryViewed(storyId: number) {
	const userId = await getSessionUserId();

	await prisma.storyView.upsert({
		where: { storyId_userId: { storyId, userId } },
		create: { storyId, userId },
		update: { viewedAt: new Date() },
	});
}

export async function toggleStoryReaction(
	storyId: number,
	reaction: ReactionType,
) {
	const userId = await getSessionUserId();

	const existing = await prisma.storyReaction.findUnique({
		where: { storyId_userId: { storyId, userId } },
	});

	if (existing) {
		if (existing.reaction === reaction) {
			// Remove reaction
			await prisma.storyReaction.delete({
				where: { storyId_userId: { storyId, userId } },
			});
			return null;
		} else {
			// Change reaction
			await prisma.storyReaction.update({
				where: { storyId_userId: { storyId, userId } },
				data: { reaction },
			});
			return reaction;
		}
	} else {
		await prisma.storyReaction.create({
			data: { storyId, userId, reaction },
		});
		return reaction;
	}
}

export async function addStoryComment(storyId: number, content: string) {
	const userId = await getSessionUserId();
	if (!content.trim()) throw new Error("Comment cannot be empty");

	const comment = await prisma.storyComment.create({
		data: { storyId, userId, content: content.trim() },
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

export async function deleteStoryComment(commentId: number) {
	const userId = await getSessionUserId();
	const comment = await prisma.storyComment.findUnique({
		where: { id: commentId },
	});
	if (!comment || comment.userId !== userId) throw new Error("Forbidden");
	await prisma.storyComment.delete({ where: { id: commentId } });
}

export async function fetchFriendsStories() {
	const userId = await getSessionUserId();

	const friendFollows = await prisma.userFollow.findMany({
		where: { followerId: userId, state: "accepted" },
		select: { followingId: true },
	});

	const ids = [userId, ...friendFollows.map((f) => f.followingId)];

	const stories = await prisma.story.findMany({
		where: { userId: { in: ids }, expiresAt: { gt: new Date() } },
		orderBy: { createdAt: "desc" },
		include: {
			user: { include: { avatar: true } },
			views: { where: { userId }, select: { id: true } },
			reactions: {
				select: {
					id: true,
					reaction: true,
					userId: true,
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
			comments: {
				orderBy: { createdAt: "asc" },
				select: {
					id: true,
					content: true,
					createdAt: true,
					userId: true,
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
			_count: {
				select: { views: true, reactions: true, comments: true },
			},
		},
	});

	return stories;
}

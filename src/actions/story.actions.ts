"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { StoryPrivacy } from "../../prisma/generated/prisma/enums";

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
			_count: { select: { views: true } },
		},
	});

	return stories;
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function sendFollowRequest(targetUserId: number) {
	const userId = await getSessionUserId();
	if (userId === targetUserId) return;

	await prisma.userFollow.upsert({
		where: {
			followerId_followingId: {
				followerId: userId,
				followingId: targetUserId,
			},
		},
		create: {
			followerId: userId,
			followingId: targetUserId,
			state: "pending",
		},
		update: { state: "pending" },
	});

	revalidatePath("/people");
}

export async function cancelFollowRequest(targetUserId: number) {
	const userId = await getSessionUserId();

	await prisma.userFollow.deleteMany({
		where: { followerId: userId, followingId: targetUserId },
	});

	revalidatePath("/people");
}

export async function acceptFollowRequest(requesterId: number) {
	const userId = await getSessionUserId();

	await prisma.userFollow.updateMany({
		where: {
			followerId: requesterId,
			followingId: userId,
			state: "pending",
		},
		data: { state: "accepted" },
	});

	revalidatePath("/people");
	revalidatePath("/notifications");
}

export async function rejectFollowRequest(requesterId: number) {
	const userId = await getSessionUserId();

	await prisma.userFollow.deleteMany({
		where: { followerId: requesterId, followingId: userId },
	});

	revalidatePath("/people");
	revalidatePath("/notifications");
}

export async function unfollowUser(targetUserId: number) {
	const userId = await getSessionUserId();

	await prisma.userFollow.deleteMany({
		where: { followerId: userId, followingId: targetUserId },
	});

	revalidatePath("/people");
}

export async function getPendingRequests() {
	const userId = await getSessionUserId();

	const requests = await prisma.userFollow.findMany({
		where: { followingId: userId, state: "pending" },
		include: {
			follower: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					location: true,
					avatar: true,
					_count: { select: { followers: true } },
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return requests;
}

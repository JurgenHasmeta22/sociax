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

	await prisma.$transaction([
		prisma.userFollow.updateMany({
			where: {
				followerId: requesterId,
				followingId: userId,
				state: "pending",
			},
			data: { state: "accepted" },
		}),
		prisma.userFollow.upsert({
			where: {
				followerId_followingId: {
					followerId: userId,
					followingId: requesterId,
				},
			},
			create: {
				followerId: userId,
				followingId: requesterId,
				state: "accepted",
			},
			update: { state: "accepted" },
		}),
	]);

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
		where: {
			OR: [
				{ followerId: userId, followingId: targetUserId },
				{ followerId: targetUserId, followingId: userId },
			],
		},
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
					_count: {
						select: { following: { where: { state: "accepted" } } },
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return requests;
}

const PEOPLE_LIMIT = 20;

export async function fetchMorePeople(skip: number, query: string) {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	const userId = parseInt(session.user.id);

	const where = query.trim()
		? {
				id: { not: userId },
				active: true,
				OR: [
					{ userName: { contains: query.trim() } },
					{ firstName: { contains: query.trim() } },
					{ lastName: { contains: query.trim() } },
				],
			}
		: { id: { not: userId }, active: true };

	const [people, total, myFollowing, incomingRequests] = await Promise.all([
		prisma.user.findMany({
			where,
			skip,
			take: PEOPLE_LIMIT,
			orderBy: { createdAt: "desc" },
			include: {
				avatar: true,
				_count: {
					select: {
						following: { where: { state: "accepted" } },
						posts: true,
					},
				},
			},
		}),
		prisma.user.count({ where }),
		prisma.userFollow.findMany({
			where: { followerId: userId },
			select: { followingId: true, state: true },
		}),
		prisma.userFollow.findMany({
			where: { followingId: userId, state: "pending" },
			select: { followerId: true },
		}),
	]);

	const outgoing = new Map(myFollowing.map((f) => [f.followingId, f.state]));
	const incoming = new Set(incomingRequests.map((r) => r.followerId));

	const followStates: Record<
		number,
		"none" | "outgoing_pending" | "incoming_pending" | "accepted"
	> = {};
	for (const p of people) {
		const out = outgoing.get(p.id);
		if (out === "accepted") followStates[p.id] = "accepted";
		else if (out === "pending") followStates[p.id] = "outgoing_pending";
		else if (incoming.has(p.id)) followStates[p.id] = "incoming_pending";
		else followStates[p.id] = "none";
	}

	return { people, followStates, total };
}

"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function globalSearch(query: string) {
	if (!query.trim()) return { people: [], groups: [], pages: [] };

	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const q = query.trim();

	const [people, groups, pages] = await Promise.all([
		prisma.user.findMany({
			where: {
				active: true,
				OR: [
					{ userName: { contains: q } },
					{ firstName: { contains: q } },
					{ lastName: { contains: q } },
				],
			},
			take: 8,
			select: {
				id: true,
				userName: true,
				firstName: true,
				lastName: true,
				avatar: { select: { photoSrc: true } },
				_count: { select: { followers: true } },
			},
		}),
		prisma.group.findMany({
			where: {
				isActive: true,
				OR: [
					{ name: { contains: q } },
					{ description: { contains: q } },
				],
			},
			take: 8,
			select: {
				id: true,
				name: true,
				slug: true,
				avatarUrl: true,
				privacy: true,
				_count: { select: { members: true } },
			},
		}),
		prisma.page.findMany({
			where: {
				isActive: true,
				OR: [
					{ name: { contains: q } },
					{ description: { contains: q } },
				],
			},
			take: 8,
			select: {
				id: true,
				name: true,
				slug: true,
				avatarUrl: true,
				category: true,
				_count: { select: { followers: true } },
			},
		}),
	]);

	let followStates: Record<number, string> = {};
	if (currentUserId && people.length > 0) {
		const personIds = people.map((p) => p.id);
		const follows = await prisma.userFollow.findMany({
			where: {
				followerId: currentUserId,
				followingId: { in: personIds },
			},
			select: { followingId: true, state: true },
		});
		followStates = Object.fromEntries(
			follows.map((f) => [f.followingId, f.state]),
		);
	}

	return { people, groups, pages, followStates };
}

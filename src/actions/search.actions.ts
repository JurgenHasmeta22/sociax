"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function globalSearch(query: string, page = 1) {
	if (!query.trim()) return { people: [], groups: [], pages: [], followStates: {}, hasMore: { people: false, groups: false, pages: false } };

	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const q = query.trim();
	const skip = (page - 1) * PAGE_SIZE;
	const take = PAGE_SIZE;

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
			skip,
			take: take + 1,
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
			skip,
			take: take + 1,
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
			skip,
			take: take + 1,
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

	const hasMorePeople = people.length > take;
	const hasMoreGroups = groups.length > take;
	const hasMorePages = pages.length > take;

	let followStates: Record<number, string> = {};
	const peoplePage = people.slice(0, take);
	if (currentUserId && peoplePage.length > 0) {
		const personIds = peoplePage.map((p) => p.id);
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

	return {
		people: peoplePage,
		groups: groups.slice(0, take),
		pages: pages.slice(0, take),
		followStates,
		hasMore: {
			people: hasMorePeople,
			groups: hasMoreGroups,
			pages: hasMorePages,
		},
	};
}

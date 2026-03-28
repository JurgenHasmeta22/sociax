"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function globalSearch(query: string, page = 1) {
	if (!query.trim())
		return {
			people: [],
			groups: [],
			pages: [],
			events: [],
			memories: [],
			followStates: {},
			hasMore: { people: false, groups: false, pages: false, events: false, memories: false },
			totals: { people: 0, groups: 0, pages: 0, events: 0, memories: 0 },
		};

	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const q = query.trim();
	const skip = (page - 1) * PAGE_SIZE;
	const take = PAGE_SIZE;

	const peopleWhere = {
		active: true,
		OR: [
			{ userName: { contains: q } },
			{ firstName: { contains: q } },
			{ lastName: { contains: q } },
		],
	};
	const groupsWhere = {
		isActive: true,
		OR: [
			{ name: { contains: q } },
			{ description: { contains: q } },
		],
	};
	const pagesWhere = {
		isActive: true,
		OR: [
			{ name: { contains: q } },
			{ description: { contains: q } },
		],
	};
	const eventsWhere = {
		OR: [
			{ title: { contains: q } },
			{ description: { contains: q } },
			{ location: { contains: q } },
		],
	};
	const memoriesWhere = currentUserId
		? { userId: currentUserId, note: { contains: q } }
		: { note: { contains: q } };

	const [people, groups, pages, events, memories, totalPeople, totalGroups, totalPages, totalEvents, totalMemories] =
		await Promise.all([
			prisma.user.findMany({
				where: peopleWhere,
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
				where: groupsWhere,
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
				where: pagesWhere,
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
			prisma.event.findMany({
				where: eventsWhere,
				skip,
				take: take + 1,
				select: {
					id: true,
					title: true,
					slug: true,
					coverUrl: true,
					location: true,
					isOnline: true,
					startDate: true,
					_count: { select: { attendees: true } },
				},
			}),
			prisma.memory.findMany({
				where: memoriesWhere,
				skip,
				take: take + 1,
				select: {
					id: true,
					note: true,
					createdAt: true,
					post: {
						select: {
							id: true,
							media: { take: 1, select: { url: true } },
						},
					},
				},
			}),
			// Counts — only on first page to avoid repeated queries
			page === 1 ? prisma.user.count({ where: peopleWhere }) : Promise.resolve(0),
			page === 1 ? prisma.group.count({ where: groupsWhere }) : Promise.resolve(0),
			page === 1 ? prisma.page.count({ where: pagesWhere }) : Promise.resolve(0),
			page === 1 ? prisma.event.count({ where: eventsWhere }) : Promise.resolve(0),
			page === 1 ? prisma.memory.count({ where: memoriesWhere }) : Promise.resolve(0),
		]);

	const hasMorePeople = people.length > take;
	const hasMoreGroups = groups.length > take;
	const hasMorePages = pages.length > take;
	const hasMoreEvents = events.length > take;
	const hasMoreMemories = memories.length > take;

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
		events: events.slice(0, take),
		memories: memories.slice(0, take),
		followStates,
		hasMore: {
			people: hasMorePeople,
			groups: hasMoreGroups,
			pages: hasMorePages,
			events: hasMoreEvents,
			memories: hasMoreMemories,
		},
		totals: {
			people: totalPeople,
			groups: totalGroups,
			pages: totalPages,
			events: totalEvents,
			memories: totalMemories,
		},
	};
}

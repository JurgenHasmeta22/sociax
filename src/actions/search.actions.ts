"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function globalSearch(query: string, page = 1) {
	const empty = {
		people: [], groups: [], pages: [], events: [], memories: [],
		videos: [], marketplace: [], blogs: [],
		followStates: {} as Record<number, string>,
		hasMore: { people: false, groups: false, pages: false, events: false, memories: false, videos: false, marketplace: false, blogs: false },
		totals: { people: 0, groups: 0, pages: 0, events: 0, memories: 0, videos: 0, marketplace: 0, blogs: 0 },
	};
	if (!query.trim()) return empty;

	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const q = query.trim();
	const skip = (page - 1) * PAGE_SIZE;
	const take = PAGE_SIZE;

	const peopleWhere = {
		active: true,
		OR: [{ userName: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }],
	};
	const groupsWhere = {
		isActive: true,
		OR: [{ name: { contains: q } }, { description: { contains: q } }],
	};
	const pagesWhere = {
		isActive: true,
		OR: [{ name: { contains: q } }, { description: { contains: q } }],
	};
	const eventsWhere = {
		OR: [{ title: { contains: q } }, { description: { contains: q } }, { location: { contains: q } }],
	};
	const memoriesWhere = currentUserId
		? { userId: currentUserId, note: { contains: q } }
		: { note: { contains: q } };
	const videosWhere = {
		isDeleted: false,
		privacy: "Public" as const,
		OR: [{ title: { contains: q } }, { description: { contains: q } }],
	};
	const marketplaceWhere = {
		status: "Active" as const,
		OR: [{ title: { contains: q } }, { description: { contains: q } }],
	};
	const blogsWhere = {
		published: true,
		isDeleted: false,
		OR: [{ title: { contains: q } }, { content: { contains: q } }],
	};

	const [
		people, groups, pages, events, memories, videos, marketplace, blogs,
		tPeople, tGroups, tPages, tEvents, tMemories, tVideos, tMarketplace, tBlogs,
	] = await Promise.all([
		prisma.user.findMany({
			where: peopleWhere, skip, take: take + 1,
			select: { id: true, userName: true, firstName: true, lastName: true, avatar: { select: { photoSrc: true } }, _count: { select: { followers: true } } },
		}),
		prisma.group.findMany({
			where: groupsWhere, skip, take: take + 1,
			select: { id: true, name: true, slug: true, avatarUrl: true, privacy: true, _count: { select: { members: true } } },
		}),
		prisma.page.findMany({
			where: pagesWhere, skip, take: take + 1,
			select: { id: true, name: true, slug: true, avatarUrl: true, category: true, _count: { select: { followers: true } } },
		}),
		prisma.event.findMany({
			where: eventsWhere, skip, take: take + 1,
			select: { id: true, title: true, slug: true, coverUrl: true, location: true, isOnline: true, startDate: true, _count: { select: { attendees: true } } },
		}),
		prisma.memory.findMany({
			where: memoriesWhere, skip, take: take + 1,
			select: { id: true, note: true, createdAt: true, post: { select: { id: true, media: { take: 1, select: { url: true } } } } },
		}),
		prisma.video.findMany({
			where: videosWhere, skip, take: take + 1,
			select: { id: true, title: true, thumbnailUrl: true, views: true, createdAt: true, author: { select: { id: true, userName: true, firstName: true, lastName: true, avatar: { select: { photoSrc: true } } } }, _count: { select: { likes: true, comments: true } } },
		}),
		prisma.marketplaceListing.findMany({
			where: marketplaceWhere, skip, take: take + 1,
			select: { id: true, title: true, slug: true, price: true, isFree: true, category: true, condition: true, location: true, images: { take: 1, select: { url: true } } },
		}),
		prisma.blog.findMany({
			where: blogsWhere, skip, take: take + 1,
			select: { id: true, title: true, slug: true, excerpt: true, coverImageUrl: true, createdAt: true, author: { select: { id: true, userName: true, firstName: true, lastName: true, avatar: { select: { photoSrc: true } } } }, _count: { select: { likes: true } } },
		}),
		page === 1 ? prisma.user.count({ where: peopleWhere }) : Promise.resolve(0),
		page === 1 ? prisma.group.count({ where: groupsWhere }) : Promise.resolve(0),
		page === 1 ? prisma.page.count({ where: pagesWhere }) : Promise.resolve(0),
		page === 1 ? prisma.event.count({ where: eventsWhere }) : Promise.resolve(0),
		page === 1 ? prisma.memory.count({ where: memoriesWhere }) : Promise.resolve(0),
		page === 1 ? prisma.video.count({ where: videosWhere }) : Promise.resolve(0),
		page === 1 ? prisma.marketplaceListing.count({ where: marketplaceWhere }) : Promise.resolve(0),
		page === 1 ? prisma.blog.count({ where: blogsWhere }) : Promise.resolve(0),
	]);

	let followStates: Record<number, string> = {};
	const peoplePage = people.slice(0, take);
	if (currentUserId && peoplePage.length > 0) {
		const personIds = peoplePage.map((p) => p.id);
		const follows = await prisma.userFollow.findMany({
			where: { followerId: currentUserId, followingId: { in: personIds } },
			select: { followingId: true, state: true },
		});
		followStates = Object.fromEntries(follows.map((f) => [f.followingId, f.state]));
	}

	return {
		people: peoplePage,
		groups: groups.slice(0, take),
		pages: pages.slice(0, take),
		events: events.slice(0, take),
		memories: memories.slice(0, take),
		videos: videos.slice(0, take),
		marketplace: marketplace.slice(0, take),
		blogs: blogs.slice(0, take),
		followStates,
		hasMore: {
			people: people.length > take, groups: groups.length > take, pages: pages.length > take,
			events: events.length > take, memories: memories.length > take, videos: videos.length > take,
			marketplace: marketplace.length > take, blogs: blogs.length > take,
		},
		totals: {
			people: tPeople, groups: tGroups, pages: tPages, events: tEvents,
			memories: tMemories, videos: tVideos, marketplace: tMarketplace, blogs: tBlogs,
		},
	};
}

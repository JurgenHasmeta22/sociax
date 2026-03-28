"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type HashtagContentType = "posts" | "events" | "blogs" | "videos";

export async function getHashtagPosts(tag: string) {
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const hashtag = await prisma.hashtag.findUnique({
		where: { name: tag.toLowerCase() },
	});
	if (!hashtag) return [];

	const posts = await prisma.post.findMany({
		where: {
			isDeleted: false,
			privacy: currentUserId
				? { in: ["Public", "FriendsOnly"] }
				: "Public",
			hashtags: { some: { hashtagId: hashtag.id } },
		},
		orderBy: { createdAt: "desc" },
		take: 30,
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
			media: { orderBy: { order: "asc" } },
			hashtags: { include: { hashtag: true } },
			_count: { select: { likes: true, comments: true } },
		},
	});

	return posts;
}

export async function getHashtagEvents(tag: string) {
	const hashtag = await prisma.hashtag.findUnique({
		where: { name: tag.toLowerCase() },
	});
	if (!hashtag) return [];

	const events = await prisma.event.findMany({
		where: {
			privacy: "Public",
			hashtags: { some: { hashtagId: hashtag.id } },
		},
		orderBy: { startDate: "asc" },
		take: 30,
		include: {
			creator: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			_count: { select: { attendees: true } },
		},
	});

	return events;
}

export async function getHashtagBlogs(tag: string) {
	const hashtag = await prisma.hashtag.findUnique({
		where: { name: tag.toLowerCase() },
	});
	if (!hashtag) return [];

	const blogs = await prisma.blog.findMany({
		where: {
			isDeleted: false,
			published: true,
			hashtags: { some: { hashtagId: hashtag.id } },
		},
		orderBy: { createdAt: "desc" },
		take: 30,
		include: {
			author: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			_count: { select: { likes: true } },
		},
	});

	return blogs;
}

export async function getHashtagVideos(tag: string) {
	const hashtag = await prisma.hashtag.findUnique({
		where: { name: tag.toLowerCase() },
	});
	if (!hashtag) return [];

	const videos = await prisma.video.findMany({
		where: {
			isDeleted: false,
			privacy: "Public",
			hashtags: { some: { hashtagId: hashtag.id } },
		},
		orderBy: { createdAt: "desc" },
		take: 30,
		include: {
			author: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			_count: { select: { likes: true, comments: true } },
		},
	});

	return videos;
}

export async function getHashtagStats(tag: string) {
	const hashtag = await prisma.hashtag.findUnique({
		where: { name: tag.toLowerCase() },
	});
	if (!hashtag) return null;

	const [postCount, eventCount, blogCount, videoCount] = await Promise.all([
		prisma.postHashtag.count({ where: { hashtagId: hashtag.id } }),
		prisma.eventHashtag.count({ where: { hashtagId: hashtag.id } }),
		prisma.blogHashtag.count({ where: { hashtagId: hashtag.id } }),
		prisma.videoHashtag.count({ where: { hashtagId: hashtag.id } }),
	]);

	return {
		hashtag,
		postCount,
		eventCount,
		blogCount,
		videoCount,
		total: postCount + eventCount + blogCount + videoCount,
	};
}

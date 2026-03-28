"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type {
	AttendeeStatus,
	EventPrivacy,
	ReactionType,
} from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

function slugify(text: string) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function randomSuffix() {
	return Math.random().toString(36).slice(2, 8);
}

export async function createEvent(data: {
	title: string;
	description?: string;
	coverUrl?: string;
	location?: string;
	isOnline: boolean;
	onlineLink?: string;
	startDate: string;
	endDate?: string;
	privacy: EventPrivacy;
	hashtags?: string[];
}) {
	const userId = await getSessionUserId();
	if (!data.title.trim()) throw new Error("Title is required");

	const base = slugify(data.title) || "event";
	const slug = `${base}-${randomSuffix()}`;

	const event = await prisma.$transaction(async (tx) => {
		const created = await tx.event.create({
			data: {
				title: data.title.trim(),
				slug,
				description: data.description?.trim() || null,
				coverUrl: data.coverUrl?.trim() || null,
				location: data.location?.trim() || null,
				isOnline: data.isOnline,
				onlineLink: data.onlineLink?.trim() || null,
				startDate: new Date(data.startDate),
				endDate: data.endDate ? new Date(data.endDate) : null,
				privacy: data.privacy,
				creatorId: userId,
			},
		});

		await tx.eventAttendee.create({
			data: { eventId: created.id, userId, status: "Going" },
		});

		// Extract hashtags from title + description + explicit tags
		const textTags = ((data.title || "") + " " + (data.description || "")).match(/#[\w]+/g) ?? [];
		const explicitTags = (data.hashtags ?? []).map((t) => t.toLowerCase().replace(/^#/, "").trim()).filter(Boolean);
		const allTags = [...new Set([...textTags.map((t) => t.slice(1).toLowerCase()), ...explicitTags])];

		for (const name of allTags) {
			if (!name) continue;
			let tag = await tx.hashtag.findUnique({ where: { name } });
			if (!tag) tag = await tx.hashtag.create({ data: { name } });
			await tx.eventHashtag.upsert({
				where: { eventId_hashtagId: { eventId: created.id, hashtagId: tag.id } },
				create: { eventId: created.id, hashtagId: tag.id },
				update: {},
			});
		}

		return created;
	});

	revalidatePath("/events");
	return { slug: event.slug };
}

export async function rsvpEvent(eventId: number, status: AttendeeStatus) {
	const userId = await getSessionUserId();

	const existing = await prisma.eventAttendee.findUnique({
		where: { eventId_userId: { eventId, userId } },
	});

	if (existing && existing.status === status) {
		await prisma.eventAttendee.delete({
			where: { eventId_userId: { eventId, userId } },
		});
	} else {
		await prisma.eventAttendee.upsert({
			where: { eventId_userId: { eventId, userId } },
			create: { eventId, userId, status },
			update: { status },
		});
	}

	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: { slug: true },
	});

	revalidatePath("/events");
	if (event) revalidatePath(`/events/${event.slug}`);
}

export async function getEventAttendees(eventId: number) {
	const attendees = await prisma.eventAttendee.findMany({
		where: { eventId },
		orderBy: { createdAt: "asc" },
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

	return {
		going: attendees.filter((a) => a.status === "Going").map((a) => a.user),
		interested: attendees
			.filter((a) => a.status === "Interested")
			.map((a) => a.user),
		notGoing: attendees
			.filter((a) => a.status === "NotGoing")
			.map((a) => a.user),
	};
}

export async function deleteEvent(eventId: number) {
	const userId = await getSessionUserId();

	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: { creatorId: true, slug: true },
	});

	if (!event) throw new Error("Event not found");
	if (event.creatorId !== userId) throw new Error("Forbidden");

	await prisma.event.delete({ where: { id: eventId } });

	revalidatePath("/events");
}

export type EventFilter = "all" | "going" | "interested" | "online";

const EVENTS_LIMIT = 20;

export async function fetchEvents(filter: EventFilter = "all", skip = 0) {
	const userId = await getSessionUserId();

	const friendIds = await prisma.userFollow
		.findMany({
			where: { followerId: userId, state: "accepted" },
			select: { followingId: true },
		})
		.then((r) => r.map((f) => f.followingId));

	const privacyFilter = {
		OR: [
			{ privacy: "Public" as EventPrivacy },
			{
				privacy: "FriendsOnly" as EventPrivacy,
				creatorId: { in: [...friendIds, userId] },
			},
			{ creatorId: userId },
		],
	};

	let attendeeFilter: object = {};
	if (filter === "going") {
		attendeeFilter = {
			attendees: { some: { userId, status: "Going" } },
		};
	} else if (filter === "interested") {
		attendeeFilter = {
			attendees: { some: { userId, status: "Interested" } },
		};
	} else if (filter === "online") {
		attendeeFilter = { isOnline: true };
	}

	const [events, total] = await Promise.all([
		prisma.event.findMany({
			where: {
				startDate: { gte: new Date() },
				...privacyFilter,
				...attendeeFilter,
			},
			orderBy: { startDate: "asc" },
			skip,
			take: EVENTS_LIMIT,
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
				attendees: {
					where: { userId },
					select: { status: true },
				},
				_count: { select: { attendees: true } },
			},
		}),
		prisma.event.count({
			where: {
				startDate: { gte: new Date() },
				...privacyFilter,
				...attendeeFilter,
			},
		}),
	]);

	return {
		events: events.map((e) => ({
			...e,
			myAttendance: e.attendees[0]?.status ?? null,
		})),
		total,
	};
}

export async function fetchPopularEvents(skip = 0) {
	const session = await getServerSession(authOptions);
	const userId = session ? parseInt(session.user.id) : null;

	const events = await prisma.event.findMany({
		where: {
			privacy: "Public",
			startDate: { gte: new Date() },
		},
		orderBy: { attendees: { _count: "desc" } },
		skip,
		take: EVENTS_LIMIT,
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
			attendees: userId
				? { where: { userId }, select: { status: true } }
				: false,
			_count: { select: { attendees: true } },
		},
	});

	return {
		events: events.map((e) => ({
			...e,
			myAttendance: (userId && Array.isArray(e.attendees) ? e.attendees[0]?.status : null) ?? null,
		})),
	};
}

export async function fetchMyEvents(skip = 0) {
	const userId = await getSessionUserId();

	const attendances = await prisma.eventAttendee.findMany({
		where: {
			userId,
			status: { in: ["Going", "Interested"] },
		},
		skip,
		take: EVENTS_LIMIT,
		orderBy: { createdAt: "desc" },
		include: {
			event: {
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
					attendees: { where: { userId }, select: { status: true } },
					_count: { select: { attendees: true } },
				},
			},
		},
	});

	return {
		events: attendances.map((a) => ({
			...a.event,
			myAttendance: a.status,
		})),
	};
}

export async function getEventPosts(eventId: number, currentUserId?: number) {
	const posts = await prisma.eventPost.findMany({
		where: { eventId, isDeleted: false },
		orderBy: { createdAt: "desc" },
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
			likes: { select: { id: true, userId: true, reactionType: true } },
			_count: { select: { comments: true } },
		},
	});

	return posts.map((p) => ({
		...p,
		myReaction: currentUserId
			? (p.likes.find((l) => l.userId === currentUserId)?.reactionType ??
				null)
			: null,
	}));
}

export async function createEventPost(
	eventId: number,
	content: string,
	mediaUrl?: string,
) {
	const userId = await getSessionUserId();

	const event = await prisma.event.findUnique({
		where: { id: eventId },
		select: { creatorId: true, slug: true },
	});
	if (!event) throw new Error("Event not found");
	if (event.creatorId !== userId)
		throw new Error("Only the event organizer can post");

	const post = await prisma.eventPost.create({
		data: {
			content: content.trim() || null,
			mediaUrl: mediaUrl ?? null,
			eventId,
			userId,
		},
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
			likes: { select: { id: true, userId: true, reactionType: true } },
			_count: { select: { comments: true } },
		},
	});

	revalidatePath(`/events/${event.slug}`);
	return { ...post, myReaction: null };
}

export async function deleteEventPost(postId: number) {
	const userId = await getSessionUserId();

	const post = await prisma.eventPost.findUnique({
		where: { id: postId },
		select: { userId: true, event: { select: { slug: true } } },
	});
	if (!post) throw new Error("Post not found");
	if (post.userId !== userId) throw new Error("Forbidden");

	await prisma.eventPost.update({
		where: { id: postId },
		data: { isDeleted: true },
	});
	revalidatePath(`/events/${post.event.slug}`);
}

export async function toggleEventPostLike(
	postId: number,
	reactionType: ReactionType,
) {
	const userId = await getSessionUserId();

	const existing = await prisma.eventPostLike.findUnique({
		where: { userId_eventPostId: { userId, eventPostId: postId } },
	});

	if (existing) {
		if (existing.reactionType === reactionType) {
			await prisma.eventPostLike.delete({
				where: { userId_eventPostId: { userId, eventPostId: postId } },
			});
		} else {
			await prisma.eventPostLike.update({
				where: { userId_eventPostId: { userId, eventPostId: postId } },
				data: { reactionType },
			});
		}
	} else {
		await prisma.eventPostLike.create({
			data: { userId, eventPostId: postId, reactionType },
		});
	}
}

export async function getEventPostComments(
	postId: number,
	currentUserId?: number,
) {
	const comments = await prisma.eventPostComment.findMany({
		where: { eventPostId: postId, isDeleted: false },
		orderBy: { createdAt: "asc" },
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
			_count: { select: { likes: true } },
			likes: currentUserId
				? { where: { userId: currentUserId }, select: { id: true } }
				: false,
		},
	});

	return comments.map((c) => ({
		...c,
		likeCount: c._count.likes,
		isLikedByMe: currentUserId
			? (c.likes as { id: number }[]).length > 0
			: false,
		likes: undefined,
		_count: undefined,
	}));
}

export async function createEventPostComment(postId: number, content: string, mediaUrl?: string) {
	const userId = await getSessionUserId();
	if (!content.trim() && !mediaUrl) throw new Error("Content required");

	await prisma.eventPostComment.create({
		data: { content: content.trim(), eventPostId: postId, userId, ...(mediaUrl ? { mediaUrl } : {}) },
	});
}

export async function deleteEventPostComment(commentId: number) {
	const userId = await getSessionUserId();

	const comment = await prisma.eventPostComment.findUnique({
		where: { id: commentId },
		select: { userId: true },
	});
	if (!comment) throw new Error("Comment not found");
	if (comment.userId !== userId) throw new Error("Forbidden");

	await prisma.eventPostComment.update({
		where: { id: commentId },
		data: { isDeleted: true },
	});
}

export async function toggleEventPostCommentLike(commentId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.eventPostCommentLike.findUnique({
		where: {
			userId_eventPostCommentId: {
				userId,
				eventPostCommentId: commentId,
			},
		},
	});

	if (existing) {
		await prisma.eventPostCommentLike.delete({
			where: {
				userId_eventPostCommentId: {
					userId,
					eventPostCommentId: commentId,
				},
			},
		});
	} else {
		await prisma.eventPostCommentLike.create({
			data: { userId, eventPostCommentId: commentId },
		});
	}
}

export async function getEventPostReactions(postId: number) {
	return prisma.eventPostLike.findMany({
		where: { eventPostId: postId },
		orderBy: { createdAt: "desc" },
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
}

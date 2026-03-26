"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { AttendeeStatus, EventPrivacy } from "../../prisma/generated/prisma/enums";

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

		return created;
	});

	revalidatePath("/events");
	return { slug: event.slug };
}

export async function rsvpEvent(eventId: number, status: AttendeeStatus) {
	const userId = await getSessionUserId();

	if (status === "NotGoing") {
		await prisma.eventAttendee.deleteMany({
			where: { eventId, userId },
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

	const friendIds = await prisma.userFollow.findMany({
		where: { followerId: userId, state: "accepted" },
		select: { followingId: true },
	}).then((r) => r.map((f) => f.followingId));

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

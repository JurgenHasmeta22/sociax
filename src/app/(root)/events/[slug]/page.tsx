import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventDetail } from "@/components/events/EventDetail";
import type { AttendeeStatus } from "../../../../../prisma/generated/prisma/enums";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
	const { slug } = await params;
	const event = await prisma.event.findUnique({
		where: { slug },
		select: { title: true },
	});
	return { title: event ? `${event.title} · Sociax` : "Event · Sociax" };
}

export default async function EventPage({ params }: PageProps) {
	const { slug } = await params;
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const event = await prisma.event.findUnique({
		where: { slug },
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
				orderBy: { createdAt: "asc" },
			},
			_count: { select: { attendees: true } },
		},
	});

	if (!event) notFound();

	const myAttendance = currentUserId
		? (event.attendees.find((a) => a.user.id === currentUserId)?.status ??
			null)
		: null;

	return (
		<EventDetail
			event={event}
			currentUserId={currentUserId}
			initialAttendance={myAttendance as AttendeeStatus | null}
		/>
	);
}

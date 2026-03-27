import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventDetail } from "@/components/events/EventDetail";
import { EventFeed } from "@/components/events/EventFeed";
import { getEventPosts } from "@/actions/event.actions";
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

	const [event, posts] = await Promise.all([
		prisma.event.findUnique({
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
		}),
		currentUserId
			? getEventPosts(
					await prisma.event
						.findUnique({ where: { slug }, select: { id: true } })
						.then((e) => e?.id ?? 0),
					currentUserId,
				)
			: [],
	]);

	if (!event) notFound();

	const myAttendance = currentUserId
		? (event.attendees.find((a) => a.user.id === currentUserId)?.status ??
			null)
		: null;

	const isOwner = currentUserId === event.creator.id;

	return (
		<div className="max-w-3xl mx-auto pb-12">
			<EventDetail
				event={event}
				currentUserId={currentUserId}
				initialAttendance={myAttendance as AttendeeStatus | null}
			/>
			<div className="px-4 mt-6 space-y-4">
				<h2 className="font-semibold text-base">Event Updates</h2>
				<EventFeed
					posts={posts as Parameters<typeof EventFeed>[0]["posts"]}
					eventId={event.id}
					currentUserId={currentUserId}
					isOwner={isOwner}
					currentUser={isOwner ? event.creator : null}
				/>
			</div>
		</div>
	);
}

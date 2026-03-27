"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	CalendarDays,
	MapPin,
	Wifi,
	Users,
	Check,
	Star,
	XCircle,
	Trash2,
	Loader2,
	ExternalLink,
} from "lucide-react";
import { rsvpEvent, deleteEvent } from "@/actions/event.actions";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { EventAttendeesModal } from "@/components/events/EventAttendeesModal";
import type { AttendeeStatus } from "../../../prisma/generated/prisma/enums";

type EventCreator = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

type Attendee = {
	status: AttendeeStatus;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};

type EventData = {
	id: number;
	title: string;
	slug: string;
	description: string | null;
	coverUrl: string | null;
	location: string | null;
	isOnline: boolean;
	onlineLink: string | null;
	startDate: Date;
	endDate: Date | null;
	privacy: string;
	creator: EventCreator;
	attendees: Attendee[];
	_count: { attendees: number };
};

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

const RSVP_OPTIONS: {
	status: AttendeeStatus;
	label: string;
	icon: React.ElementType;
}[] = [
	{ status: "Going", label: "Going", icon: Check },
	{ status: "Interested", label: "Interested", icon: Star },
	{ status: "NotGoing", label: "Not going", icon: XCircle },
];

export function EventDetail({
	event,
	currentUserId,
	initialAttendance,
}: {
	event: EventData;
	currentUserId: number | null;
	initialAttendance: AttendeeStatus | null;
}) {
	const router = useRouter();
	const [attendance, setAttendance] = useState<AttendeeStatus | null>(
		initialAttendance,
	);
	const [isPending, startTransition] = useTransition();
	const [isDeleting, startDeleteTransition] = useTransition();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const isOwner = currentUserId === event.creator.id;
	const creatorName = displayName(event.creator);

	const goingAttendees = event.attendees.filter((a) => a.status === "Going");
	const interestedCount = event.attendees.filter(
		(a) => a.status === "Interested",
	).length;
	const goingCount = event.attendees.filter(
		(a) => a.status === "Going",
	).length;

	const handleRsvp = (status: AttendeeStatus) => {
		if (!currentUserId) return;
		const isSame = attendance === status;
		setAttendance(isSame ? null : status);
		startTransition(async () => {
			try {
				await rsvpEvent(event.id, status);
			} catch {
				toast.error("Failed to update RSVP.");
				setAttendance(attendance);
			}
		});
	};

	const handleDelete = () => {
		if (!isOwner) return;
		startDeleteTransition(async () => {
			try {
				await deleteEvent(event.id);
				toast.success("Event deleted.");
				router.push("/events");
			} catch {
				toast.error("Failed to delete event.");
			}
		});
	};

	return (
		<div className="max-w-3xl mx-auto pb-12">
			<div className="relative h-64 md:h-80 bg-muted rounded-b-2xl overflow-hidden">
				{event.coverUrl ? (
					<Image
						src={event.coverUrl}
						alt={event.title}
						fill
						unoptimized
						className="object-cover"
						sizes="768px"
						priority
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
						<CalendarDays className="h-20 w-20 text-primary/30" />
					</div>
				)}
			</div>

			<div className="px-4 mt-6 space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl font-bold leading-tight">
							{event.title}
						</h1>
						<div className="flex flex-wrap items-center gap-2 mt-2">
							<Badge
								variant="outline"
								className="text-xs capitalize"
							>
								{event.privacy}
							</Badge>
							{event.isOnline && (
								<Badge variant="secondary" className="text-xs">
									<Wifi className="h-3 w-3 mr-1" />
									Online
								</Badge>
							)}
						</div>
					</div>
					{isOwner && (
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={isDeleting}
							className="shrink-0"
						>
							{isDeleting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
							<span className="ml-1.5">Delete</span>
						</Button>
					)}
				</div>

				<div className="grid sm:grid-cols-2 gap-3 text-sm">
					<div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
						<CalendarDays className="h-5 w-5 text-primary shrink-0 mt-0.5" />
						<div>
							<p className="font-semibold">
								{format(
									new Date(event.startDate),
									"EEEE, MMMM d, yyyy",
								)}
							</p>
							<p className="text-muted-foreground">
								{format(new Date(event.startDate), "h:mm a")}
								{event.endDate && (
									<>
										{" "}
										–{" "}
										{format(
											new Date(event.endDate),
											"h:mm a",
										)}
									</>
								)}
							</p>
						</div>
					</div>

					{event.isOnline ? (
						<div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
							<Wifi className="h-5 w-5 text-primary shrink-0 mt-0.5" />
							<div>
								<p className="font-semibold">Online event</p>
								{event.onlineLink && (
									<a
										href={event.onlineLink}
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline flex items-center gap-1 text-xs mt-0.5"
									>
										Join link
										<ExternalLink className="h-3 w-3" />
									</a>
								)}
							</div>
						</div>
					) : event.location ? (
						<div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
							<MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
							<div>
								<p className="font-semibold">Location</p>
								<p className="text-muted-foreground">
									{event.location}
								</p>
							</div>
						</div>
					) : null}
				</div>

				{currentUserId && (
					<div className="flex gap-2">
						{RSVP_OPTIONS.map(({ status, label, icon: Icon }) => (
							<Button
								key={status}
								variant={
									attendance === status
										? "default"
										: "outline"
								}
								className="flex-1 gap-1.5"
								onClick={() => handleRsvp(status)}
								disabled={isPending}
							>
								<Icon className="h-4 w-4" />
								{label}
							</Button>
						))}
					</div>
				)}

				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<EventAttendeesModal
						eventId={event.id}
						goingCount={goingCount}
						interestedCount={interestedCount}
					/>
				</div>

				<Separator />

				<div className="flex items-center gap-3">
					<Link
						href={`/profile/${event.creator.userName}`}
						className="shrink-0"
					>
						<Avatar className="h-10 w-10">
							<AvatarImage
								src={
									event.creator.avatar?.photoSrc ?? undefined
								}
							/>
							<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
								{creatorName[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>
					<div>
						<p className="text-xs text-muted-foreground">
							Organised by
						</p>
						<Link
							href={`/profile/${event.creator.userName}`}
							className="font-semibold text-sm hover:underline"
						>
							{creatorName}
						</Link>
					</div>
				</div>

				{event.description && (
					<>
						<Separator />
						<div>
							<h2 className="font-semibold mb-2">
								About this event
							</h2>
							<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
								{event.description}
							</p>
						</div>
					</>
				)}

				{goingAttendees.length > 0 && (
					<>
						<Separator />
						<div>
							<div className="flex items-center gap-2 mb-3">
								<Users className="h-4 w-4" />
								<h2 className="font-semibold">People going</h2>
							</div>
							<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
								{goingAttendees.slice(0, 16).map(({ user }) => {
									const n = displayName(user);
									return (
										<Link
											key={user.id}
											href={`/profile/${user.userName}`}
											className="flex flex-col items-center gap-1 group"
										>
											<Avatar className="h-11 w-11">
												<AvatarImage
													src={
														user.avatar?.photoSrc ??
														undefined
													}
												/>
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
													{n[0]?.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="text-[10px] text-muted-foreground group-hover:text-foreground truncate w-full text-center leading-tight">
												{n.split(" ")[0]}
											</span>
										</Link>
									);
								})}
							</div>
						</div>
					</>
				)}
			</div>
			<ConfirmDeleteDialog
				open={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
				title="Delete event?"
				description="This event and all its attendees will be permanently removed."
				isPending={isDeleting}
			/>
		</div>
	);
}

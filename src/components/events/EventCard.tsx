import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, Wifi } from "lucide-react";
import type { AttendeeStatus } from "../../../prisma/generated/prisma/enums";

type EventCardProps = {
	event: {
		id: number;
		title: string;
		slug: string;
		coverUrl: string | null;
		location: string | null;
		isOnline: boolean;
		startDate: Date;
		_count: { attendees: number };
	};
	attendance: AttendeeStatus | null;
};

const ATTENDANCE_BADGE: Record<
	string,
	{ label: string; variant: "default" | "secondary" | "outline" }
> = {
	Going: { label: "Going", variant: "default" },
	Interested: { label: "Interested", variant: "secondary" },
};

export function EventCard({ event, attendance }: EventCardProps) {
	return (
		<Link href={`/events/${event.slug}`} className="group block">
			<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
				<div className="relative h-40 bg-muted">
					{event.coverUrl ? (
						<Image
							src={event.coverUrl}
							alt={event.title}
							fill
							unoptimized
							className="object-cover group-hover:scale-105 transition-transform duration-200"
							sizes="400px"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<CalendarDays className="h-12 w-12 text-muted-foreground/30" />
						</div>
					)}
					{attendance && ATTENDANCE_BADGE[attendance] && (
						<div className="absolute top-2 right-2">
							<Badge
								variant={ATTENDANCE_BADGE[attendance].variant}
							>
								{ATTENDANCE_BADGE[attendance].label}
							</Badge>
						</div>
					)}
				</div>
				<CardContent className="p-4">
					<p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
						{event.title}
					</p>
					<div className="mt-2 space-y-1 text-xs text-muted-foreground">
						<p className="flex items-center gap-1.5">
							<CalendarDays className="h-3.5 w-3.5 shrink-0" />
							{format(
								new Date(event.startDate),
								"EEE, MMM d · h:mm a",
							)}
						</p>
						{event.isOnline ? (
							<p className="flex items-center gap-1.5">
								<Wifi className="h-3.5 w-3.5 shrink-0" />
								Online event
							</p>
						) : event.location ? (
							<p className="flex items-center gap-1.5 truncate">
								<MapPin className="h-3.5 w-3.5 shrink-0" />
								{event.location}
							</p>
						) : null}
						<p className="flex items-center gap-1.5">
							<Users className="h-3.5 w-3.5 shrink-0" />
							{event._count.attendees} attending
						</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

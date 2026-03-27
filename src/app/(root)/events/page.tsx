import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { fetchEvents, type EventFilter } from "@/actions/event.actions";
import { EventCard } from "@/components/events/EventCard";
import { CreateEventButton } from "@/components/events/CreateEventButton";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Events · Sociax" };

const TABS: { label: string; value: EventFilter }[] = [
	{ label: "All events", value: "all" },
	{ label: "Going", value: "going" },
	{ label: "Interested", value: "interested" },
	{ label: "Online", value: "online" },
];

type PageProps = { searchParams: Promise<{ filter?: string }> };

export default async function EventsPage({ searchParams }: PageProps) {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const { filter: rawFilter } = await searchParams;
	const filter = (
		["all", "going", "interested", "online"].includes(rawFilter ?? "")
			? rawFilter
			: "all"
	) as EventFilter;

	const { events } = await fetchEvents(filter, 0);

	return (
		<div className="max-w-5xl mx-auto px-4 py-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<CalendarDays className="h-6 w-6 text-primary" />
						Events
					</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Discover and join events near you
					</p>
				</div>
				<CreateEventButton />
			</div>

			<div className="flex gap-1 mb-6 border-b border-border">
				{TABS.map((tab) => (
					<Link
						key={tab.value}
						href={`/events?filter=${tab.value}`}
						className={cn(
							"relative px-4 py-3 text-sm font-semibold transition-colors",
							filter === tab.value
								? "text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{tab.label}
						{filter === tab.value && (
							<span className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
						)}
					</Link>
				))}
			</div>

			{events.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					<CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
					<p className="font-medium text-lg">No events found</p>
					<p className="text-sm mt-1">
						{filter === "all"
							? "Be the first to create an event!"
							: "Try a different filter or create your own event."}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{events.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							attendance={event.myAttendance}
						/>
					))}
				</div>
			)}
		</div>
	);
}

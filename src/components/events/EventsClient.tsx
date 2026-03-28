"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CalendarDays, ChevronRight, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import {
	rsvpEvent,
	fetchEvents,
	fetchPopularEvents,
	fetchMyEvents,
} from "@/actions/event.actions";
import type { AttendeeStatus } from "../../../prisma/generated/prisma/enums";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type Tab = "suggestions" | "popular" | "myevents";

type EventItem = {
	id: number;
	title: string;
	slug: string;
	coverUrl: string | null;
	location: string | null;
	isOnline: boolean;
	startDate: Date;
	myAttendance: AttendeeStatus | null;
	_count: { attendees: number };
};

const STATIC_LISTS = [
	{ city: "Miami", category: "Hotels" },
	{ city: "Florida", category: "Hotels" },
	{ city: "London", category: "Hotels" },
	{ city: "Dubai", category: "Hotels" },
	{ city: "Turkey", category: "Restaurant" },
	{ city: "Paris", category: "Culture" },
];

function formatDate(date: Date) {
	const d = new Date(date);
	const now = new Date();
	const diff = d.getTime() - now.getTime();
	const days = Math.ceil(diff / 86_400_000);
	if (days <= 7 && days > 0) return "Next week";
	if (days === 0) return "Today";
	return format(d, "EEE MMM d, yyyy 'at' h:mm a").toUpperCase();
}

function isUpcoming(date: Date) {
	return new Date(date) > new Date();
}

function FeaturedEventCard({ event }: { event: EventItem }) {
	const [attendance, setAttendance] = useState(event.myAttendance);
	const [isPending, startTransition] = useTransition();
	const dateStr = formatDate(event.startDate);
	const isSpecialDate =
		dateStr.includes("WED") ||
		dateStr.includes("THU") ||
		dateStr.includes("MON");

	const handleRsvp = () => {
		const next: AttendeeStatus =
			attendance === "Interested" ? "Going" : "Interested";
		setAttendance(next);
		startTransition(() => rsvpEvent(event.id, next));
	};

	return (
		<div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
			<Link href={`/events/${event.slug}`}>
				<div className="relative h-40 bg-muted">
					{event.coverUrl ? (
						<Image
							src={event.coverUrl}
							alt={event.title}
							fill
							unoptimized
							className="object-cover"
							sizes="320px"
						/>
					) : (
						<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
							<CalendarDays className="h-10 w-10 text-primary/30" />
						</div>
					)}
				</div>
			</Link>
			<div className="p-3">
				<p
					className={`text-xs font-semibold mb-0.5 ${isSpecialDate ? "text-red-400" : "text-primary"}`}
				>
					{dateStr}
				</p>
				<Link href={`/events/${event.slug}`}>
					<h3 className="font-bold text-sm leading-tight hover:underline line-clamp-2">
						{event.title}
					</h3>
				</Link>
				<p className="text-xs text-muted-foreground mt-0.5">
					{event.isOnline
						? "Online"
						: (event.location ?? "Somewhere")}
				</p>
				<p className="text-xs text-muted-foreground">
					{event._count.attendees} Interested &middot; 0 Going
				</p>
				<div className="flex gap-2 mt-2">
					<Button
						size="sm"
						className="flex-1 font-semibold"
						variant={
							attendance === "Interested" ||
							attendance === "Going"
								? "secondary"
								: "default"
						}
						onClick={handleRsvp}
						disabled={isPending}
					>
						{isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : attendance === "Going" ||
						  attendance === "Interested" ? (
							"Interested"
						) : (
							"Interested"
						)}
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="shrink-0 px-2"
					>
						<Share2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

const EVENTS_LIMIT = 20;

export function EventsClient({
	initialSuggestions,
	initialSuggestionsTotal,
	initialPopular,
	initialPopularTotal,
	initialMyEvents,
	initialMyEventsTotal,
}: {
	initialSuggestions: EventItem[];
	initialSuggestionsTotal: number;
	initialPopular: EventItem[];
	initialPopularTotal: number;
	initialMyEvents: EventItem[];
	initialMyEventsTotal: number;
}) {
	const [tab, setTab] = useState<Tab>("suggestions");
	const [suggestions, setSuggestions] = useState(initialSuggestions);
	const [suggestionsTotal] = useState(initialSuggestionsTotal);
	const [popular, setPopular] = useState(initialPopular);
	const [popularTotal] = useState(initialPopularTotal);
	const [myEvents, setMyEvents] = useState(initialMyEvents);
	const [myEventsTotal] = useState(initialMyEventsTotal);
	const [loadingMore, setLoadingMore] = useState(false);
	const [sortBy, setSortBy] = useState<
		"date_asc" | "date_desc" | "most_attendees" | "a_z"
	>("date_asc");

	const rawEvents =
		tab === "suggestions"
			? suggestions
			: tab === "popular"
				? popular
				: myEvents;

	const events = useMemo(() => {
		const sorted = [...rawEvents];
		switch (sortBy) {
			case "date_desc":
				return sorted.sort(
					(a, b) =>
						new Date(b.startDate).getTime() -
						new Date(a.startDate).getTime(),
				);
			case "most_attendees":
				return sorted.sort(
					(a, b) => b._count.attendees - a._count.attendees,
				);
			case "a_z":
				return sorted.sort((a, b) => a.title.localeCompare(b.title));
			default:
				return sorted.sort(
					(a, b) =>
						new Date(a.startDate).getTime() -
						new Date(b.startDate).getTime(),
				);
		}
	}, [rawEvents, sortBy]);

	const total =
		tab === "suggestions"
			? suggestionsTotal
			: tab === "popular"
				? popularTotal
				: myEventsTotal;

	const hasMore = events.length < total;

	const featured = events.slice(0, 4);
	const upcoming = events.filter((e) => isUpcoming(e.startDate));
	const upcomingAfterFeatured = upcoming.filter(
		(e) => !featured.find((f) => f.id === e.id),
	);

	const handleLoadMore = async () => {
		setLoadingMore(true);
		try {
			const skip = events.length;
			let result: { events: EventItem[]; total: number };
			if (tab === "suggestions") {
				result = (await fetchEvents("all", skip)) as typeof result;
				setSuggestions((prev) => [...prev, ...result.events]);
			} else if (tab === "popular") {
				result = (await fetchPopularEvents(skip)) as typeof result;
				setPopular((prev) => [...prev, ...result.events]);
			} else {
				result = (await fetchMyEvents(skip)) as typeof result;
				setMyEvents((prev) => [...prev, ...result.events]);
			}
		} finally {
			setLoadingMore(false);
		}
	};

	const sentinelRef = useInfiniteScroll(handleLoadMore, {
		hasMore,
		loading: loadingMore,
	});

	const TABS: { key: Tab; label: string }[] = [
		{ key: "suggestions", label: "Suggestions" },
		{ key: "popular", label: "Popular" },
		{ key: "myevents", label: "My Events" },
	];

	return (
		<>
			{/* Tabs */}
			<div className="flex items-center justify-between border-b border-border mb-6">
				<div className="flex gap-0">
					{TABS.map(({ key, label }) => (
						<button
							key={key}
							onClick={() => setTab(key)}
							className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
								tab === key
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{label}
							{tab === key && (
								<span className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground rounded-t-full" />
							)}
						</button>
					))}
				</div>
				<Select
					value={sortBy}
					onValueChange={(v) => setSortBy(v as typeof sortBy)}
				>
					<SelectTrigger className="w-44 h-9 text-sm mb-1">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="date_asc">Soonest first</SelectItem>
						<SelectItem value="date_desc">Latest first</SelectItem>
						<SelectItem value="most_attendees">
							Most popular
						</SelectItem>
						<SelectItem value="a_z">A → Z</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{events.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					<CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
					<p className="font-medium text-lg">No events found</p>
					{tab === "myevents" && (
						<p className="text-sm mt-1">
							You haven&apos;t RSVP&apos;d to any events yet
						</p>
					)}
				</div>
			) : (
				<>
					{/* Featured 4-col grid */}
					{featured.length > 0 && (
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
							{featured.map((event) => (
								<FeaturedEventCard
									key={event.id}
									event={event}
								/>
							))}
						</div>
					)}

					{/* Lists You May Like */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-1">
							<div>
								<h2 className="text-lg font-bold">
									Lists You May Like
								</h2>
								<p className="text-xs text-muted-foreground">
									Find a group by browsing top categories.
								</p>
							</div>
							<button className="text-sm text-primary hover:underline font-medium">
								See all
							</button>
						</div>
						<div className="relative mt-3">
							<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
								{STATIC_LISTS.map((item, i) => (
									<div
										key={i}
										className="relative shrink-0 w-44 h-28 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-muted"
									>
										<div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
										<div className="absolute bottom-0 left-0 right-0 p-3">
											<p className="text-white/70 text-xs">
												{item.city}
											</p>
											<p className="text-white font-bold text-sm">
												{item.category}
											</p>
										</div>
									</div>
								))}
							</div>
							<button className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors">
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Upcoming Events */}
					{upcomingAfterFeatured.length > 0 && (
						<div className="mb-6">
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-lg font-bold">
									Upcoming Events
								</h2>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{upcomingAfterFeatured.map((event) => (
									<FeaturedEventCard
										key={event.id}
										event={event}
									/>
								))}
							</div>
						</div>
					)}

					{/* Load More sentinel */}
					{hasMore && (
						<div
							ref={sentinelRef}
							className="flex justify-center py-6"
						>
							{loadingMore && (
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							)}
						</div>
					)}
				</>
			)}
		</>
	);
}

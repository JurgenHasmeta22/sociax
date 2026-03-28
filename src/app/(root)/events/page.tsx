import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import {
	fetchEvents,
	fetchPopularEvents,
	fetchMyEvents,
} from "@/actions/event.actions";
import { EventsClient } from "@/components/events/EventsClient";
import { CreateEventButton } from "@/components/events/CreateEventButton";

export const metadata = { title: "Events · Sociax" };

export default async function EventsPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const [suggestions, popular, myEvents] = await Promise.all([
		fetchEvents("all", 0),
		fetchPopularEvents(0),
		fetchMyEvents(0),
	]);

	return (
		<div className="max-w-5xl mx-auto px-4 py-6">
			<div className="flex items-center justify-between mb-1">
				<h1 className="text-2xl font-bold">Events</h1>
				<CreateEventButton />
			</div>
			<EventsClient
				initialSuggestions={suggestions.events as never[]}
				initialPopular={popular.events as never[]}
				initialMyEvents={myEvents.events as never[]}
			/>
		</div>
	);
}

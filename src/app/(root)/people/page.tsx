import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { PersonCard } from "@/components/people/PersonCard";

export const metadata = { title: "People · Sociax" };

export default async function PeoplePage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [people, myFollowing, incomingRequests] = await Promise.all([
		prisma.user.findMany({
			where: { id: { not: userId }, active: true },
			orderBy: { createdAt: "desc" },
			include: {
				avatar: true,
				_count: { select: { followers: true, posts: true } },
			},
		}),
		prisma.userFollow.findMany({
			where: { followerId: userId },
			select: { followingId: true, state: true },
		}),
		prisma.userFollow.findMany({
			where: { followingId: userId, state: "pending" },
			select: { followerId: true },
		}),
	]);

	const outgoingMap = new Map(
		myFollowing.map((f) => [f.followingId, f.state]),
	);
	const incomingSet = new Set(incomingRequests.map((r) => r.followerId));

	const getFollowState = (personId: number) => {
		const outState = outgoingMap.get(personId);
		if (outState === "accepted") return "accepted" as const;
		if (outState === "pending") return "outgoing_pending" as const;
		if (incomingSet.has(personId)) return "incoming_pending" as const;
		return "none" as const;
	};

	return (
		<div className="max-w-5xl mx-auto px-4 py-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold">People</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Discover people to connect with
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search people..."
						className="pl-9 rounded-full"
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
				{people.map((person) => (
					<PersonCard
						key={person.id}
						person={person}
						initialFollowState={getFollowState(person.id)}
					/>
				))}
			</div>

			{people.length === 0 && (
				<div className="text-center py-20 text-muted-foreground">
					<Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
					<p className="font-medium text-lg">No people to show</p>
					<p className="text-sm mt-1">
						You&apos;ve connected with everyone!
					</p>
				</div>
			)}
		</div>
	);
}

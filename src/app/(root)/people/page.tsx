import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PeopleClient } from "@/components/people/PeopleClient";

export const metadata = { title: "People · Sociax" };

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function PeoplePage({ searchParams }: PageProps) {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);
	const { q = "" } = await searchParams;

	const where = q.trim()
		? {
				id: { not: userId },
				active: true,
				OR: [
					{ userName: { contains: q.trim() } },
					{ firstName: { contains: q.trim() } },
					{ lastName: { contains: q.trim() } },
				],
			}
		: { id: { not: userId }, active: true };

	const [people, total, myFollowing, incomingRequests] = await Promise.all([
		prisma.user.findMany({
			where,
			orderBy: { createdAt: "desc" },
			take: 20,
			include: {
				avatar: true,
				_count: { select: { followers: true, posts: true } },
			},
		}),
		prisma.user.count({ where }),
		prisma.userFollow.findMany({
			where: { followerId: userId },
			select: { followingId: true, state: true },
		}),
		prisma.userFollow.findMany({
			where: { followingId: userId, state: "pending" },
			select: { followerId: true },
		}),
	]);

	const outgoing = new Map(myFollowing.map((f) => [f.followingId, f.state]));
	const incoming = new Set(incomingRequests.map((r) => r.followerId));

	const followStates: Record<
		number,
		"none" | "outgoing_pending" | "incoming_pending" | "accepted"
	> = {};
	for (const p of people) {
		const out = outgoing.get(p.id);
		if (out === "accepted") followStates[p.id] = "accepted";
		else if (out === "pending") followStates[p.id] = "outgoing_pending";
		else if (incoming.has(p.id)) followStates[p.id] = "incoming_pending";
		else followStates[p.id] = "none";
	}

	return (
		<PeopleClient
			initialPeople={people}
			initialFollowStates={followStates}
			total={total}
			initialQuery={q}
		/>
	);
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { GroupsClient } from "@/components/groups/GroupsClient";

export const metadata = { title: "Groups · Sociax" };

export default async function GroupsPage() {
	const session = await getServerSession(authOptions);
	const userId = session ? parseInt(session.user.id) : null;

	const TAKE = 12;

	const [suggestions, popular, memberships] = await Promise.all([
		prisma.group.findMany({
			orderBy: { createdAt: "desc" },
			take: TAKE,
			include: {
				owner: { include: { avatar: true } },
				_count: { select: { members: true, posts: true } },
			},
		}),
		prisma.group.findMany({
			orderBy: { members: { _count: "desc" } },
			take: TAKE,
			include: {
				owner: { include: { avatar: true } },
				_count: { select: { members: true, posts: true } },
			},
		}),
		userId
			? prisma.groupMember.findMany({
					where: { userId },
					select: { groupId: true, status: true },
				})
			: [],
	]);

	// My groups
	let myGroups: typeof suggestions = [];
	let totalMyGroups = 0;
	if (userId) {
		const myMemberships = await prisma.groupMember.findMany({
			where: { userId, status: "Approved" },
			take: TAKE,
			orderBy: { joinedAt: "desc" },
			include: {
				group: {
					include: {
						owner: { include: { avatar: true } },
						_count: { select: { members: true, posts: true } },
					},
				},
			},
		});
		myGroups = myMemberships.map((m) => m.group);
		totalMyGroups = await prisma.groupMember.count({
			where: { userId, status: "Approved" },
		});
	}

	const [totalSuggestions, totalPopular] = await Promise.all([
		prisma.group.count(),
		prisma.group.count(),
	]);

	const membershipMap: Record<number, string> = {};
	for (const m of memberships) membershipMap[m.groupId] = m.status;

	return (
		<GroupsClient
			initialSuggestions={suggestions}
			initialPopular={popular}
			initialMyGroups={myGroups}
			totalSuggestions={totalSuggestions}
			totalPopular={totalPopular}
			totalMyGroups={totalMyGroups}
			membershipMap={membershipMap}
			isLoggedIn={!!session}
		/>
	);
}


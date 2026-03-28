import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { GroupCategoriesClient } from "@/components/groups/GroupCategoriesClient";

export const metadata = { title: "Group Categories · Sociax" };

const STATIC_CATEGORIES = [
	"Shopping",
	"Health",
	"Science",
	"Travel",
	"Business",
	"Technology",
	"Arts",
	"Sports",
];

export default async function GroupCategoriesPage({
	searchParams,
}: {
	searchParams: Promise<{ cat?: string }>;
}) {
	const session = await getServerSession(authOptions);
	const userId = session ? parseInt(session.user.id) : null;
	const { cat } = await searchParams;
	const selectedCategory = cat && STATIC_CATEGORIES.includes(cat) ? cat : null;

	const TAKE = 20;

	const groups = await prisma.group.findMany({
		where: selectedCategory
			? { name: { contains: selectedCategory } }
			: undefined,
		orderBy: { members: { _count: "desc" } },
		take: TAKE,
		include: {
			owner: { include: { avatar: true } },
			_count: { select: { members: true, posts: true } },
		},
	});

	const memberships =
		userId
			? await prisma.groupMember.findMany({
					where: { userId },
					select: { groupId: true, status: true },
				})
			: [];

	const membershipMap: Record<number, string> = {};
	for (const m of memberships) membershipMap[m.groupId] = m.status;

	return (
		<GroupCategoriesClient
			groups={groups as never}
			membershipMap={membershipMap}
			isLoggedIn={!!session}
			selectedCategory={selectedCategory}
		/>
	);
}


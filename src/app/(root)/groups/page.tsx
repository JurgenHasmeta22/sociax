import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { GroupsClient } from "@/components/groups/GroupsClient";

export const metadata = { title: "Groups · Sociax" };

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function GroupsPage({ searchParams }: PageProps) {
const session = await getServerSession(authOptions);
const userId = session ? parseInt(session.user.id) : null;
const { q = "" } = await searchParams;

const where = q.trim() ? { name: { contains: q.trim() } } : undefined;

const [groups, total, memberships] = await Promise.all([
prisma.group.findMany({
where,
orderBy: { createdAt: "desc" },
take: 12,
include: {
owner: { include: { avatar: true } },
_count: { select: { members: true, posts: true } },
},
}),
prisma.group.count({ where }),
userId
? prisma.groupMember.findMany({
where: { userId },
select: { groupId: true, status: true },
})
: [],
]);

const membershipMap: Record<number, string> = {};
for (const m of memberships) membershipMap[m.groupId] = m.status;

return (
<GroupsClient
initialGroups={groups}
total={total}
initialQuery={q}
membershipMap={membershipMap}
isLoggedIn={!!session}
/>
);
}
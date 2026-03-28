import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeftSidebar } from "@/components/feed/LeftSidebar";
import { CollapsibleSidebar } from "@/components/feed/CollapsibleSidebar";

export default async function GroupsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [currentUser, friendIds] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			include: {
				avatar: true,
				_count: { select: { followers: true, posts: true } },
			},
		}),
		prisma.userFollow
			.findMany({
				where: { followerId: userId, state: "accepted" },
				select: { followingId: true },
			})
			.then((rows) => rows.map((r) => r.followingId)),
	]);

	if (!currentUser) redirect("/login");

	const shortcuts =
		friendIds.length > 0
			? await prisma.user.findMany({
					where: { id: { in: friendIds.slice(0, 3) } },
					include: { avatar: true },
					take: 3,
				})
			: [];

	return (
		<div className="flex min-h-[calc(100vh-56px)]">
			<CollapsibleSidebar>
				<LeftSidebar user={currentUser} shortcuts={shortcuts} />
			</CollapsibleSidebar>
			<main className="flex-1 min-w-0">{children}</main>
		</div>
	);
}

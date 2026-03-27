import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeftSidebar } from "@/components/feed/LeftSidebar";
import { PagesClient } from "@/components/pages/PagesClient";

export const metadata = { title: "Pages · Sociax" };

export default async function PagesPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [currentUser, pages, total, myFollows] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			include: {
				avatar: true,
				_count: {
					select: { followers: true, following: true, posts: true },
				},
			},
		}),
		prisma.page.findMany({
			where: { isActive: true },
			take: 20,
			orderBy: { createdAt: "desc" },
			include: { _count: { select: { followers: true, posts: true } } },
		}),
		prisma.page.count({ where: { isActive: true } }),
		prisma.pageFollower.findMany({
			where: { userId },
			select: { pageId: true },
		}),
	]);

	if (!currentUser) redirect("/login");

	const followedIds = new Set(myFollows.map((f) => f.pageId));
	const initialPages = pages.map((p) => ({
		...p,
		isFollowing: followedIds.has(p.id),
	}));

	return (
		<div className="flex bg-muted/20 min-h-[calc(100vh-56px)]">
			<aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-border/60">
				<LeftSidebar user={currentUser} />
			</aside>

			<main className="flex-1 py-6 px-4 max-w-6xl mx-auto w-full">
				<h1 className="text-2xl font-bold mb-6">Pages</h1>
				<PagesClient initialPages={initialPages} />
			</main>
		</div>
	);
}

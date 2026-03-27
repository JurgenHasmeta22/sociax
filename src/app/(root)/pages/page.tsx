import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PagesClient } from "@/components/pages/PagesClient";

export const metadata = { title: "Pages · Sociax" };

export default async function PagesPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [pages, myFollows, ownedPages, suggestedPages] = await Promise.all([
		prisma.page.findMany({
			where: { isActive: true },
			take: 20,
			orderBy: { createdAt: "desc" },
			include: { _count: { select: { followers: true, posts: true } } },
		}),
		prisma.pageFollower.findMany({
			where: { userId },
			select: { pageId: true },
		}),
		prisma.page.findMany({
			where: { ownerId: userId, isActive: true },
			take: 6,
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				name: true,
				slug: true,
				avatarUrl: true,
				updatedAt: true,
			},
		}),
		prisma.page.findMany({
			where: { isActive: true },
			take: 4,
			orderBy: { followers: { _count: "desc" } },
			select: {
				id: true,
				name: true,
				slug: true,
				avatarUrl: true,
				updatedAt: true,
			},
		}),
	]);

	const followedIds = new Set(myFollows.map((f) => f.pageId));
	const initialPages = pages.map((p) => ({
		...p,
		coverUrl: null as string | null,
		isFollowing: followedIds.has(p.id),
	}));

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 min-h-[calc(100vh-56px)]">
			<PagesClient
				initialPages={initialPages}
				ownedPages={ownedPages}
				suggestedPages={suggestedPages}
			/>
		</div>
	);
}


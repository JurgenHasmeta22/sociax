import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeftSidebar } from "@/components/feed/LeftSidebar";
import { RightSidebar } from "@/components/feed/RightSidebar";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";

export default async function FeedPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const friendFollows = await prisma.userFollow.findMany({
		where: { followerId: userId, state: "accepted" },
		select: { followingId: true },
	});
	const friendIds = friendFollows.map((f) => f.followingId);
	const allowedIds = [userId, ...friendIds];

	const [currentUser, posts, stories, suggestedUsers, events] =
		await Promise.all([
			prisma.user.findUnique({
				where: { id: userId },
				include: {
					avatar: true,
					_count: { select: { followers: true, posts: true } },
				},
			}),
			prisma.post.findMany({
				where: {
					isDeleted: false,
					userId: { in: allowedIds },
					OR: [
						{ userId },
						{ privacy: { in: ["Public", "FriendsOnly"] } },
					],
				},
				orderBy: { createdAt: "desc" },
				take: 20,
				include: {
					user: { include: { avatar: true } },
					media: true,
					likes: { select: { id: true, reactionType: true, userId: true } },
					saves: { where: { userId }, select: { id: true } },
					_count: { select: { comments: true, shares: true } },
					hashtags: { include: { hashtag: true } },
				},
			}),
			prisma.story.findMany({
				where: {
					userId: { in: allowedIds },
					expiresAt: { gt: new Date() },
				},
				take: 15,
				orderBy: { createdAt: "desc" },
				include: {
					user: { include: { avatar: true } },
					views: { where: { userId }, select: { id: true } },
					_count: { select: { views: true } },
				},
			}),
			prisma.user.findMany({
				where: { id: { not: userId }, active: true },
				take: 5,
				orderBy: { createdAt: "desc" },
				include: {
					avatar: true,
					_count: { select: { followers: true } },
				},
			}),
			prisma.event.findMany({
				where: { startDate: { gt: new Date() } },
				take: 3,
				orderBy: { startDate: "asc" },
				include: { _count: { select: { attendees: true } } },
			}),
		]);

	if (!currentUser) redirect("/login");

	const suggestedIds = suggestedUsers.map((u) => u.id);
	const myFollowsOfSuggested = await prisma.userFollow.findMany({
		where: { followerId: userId, followingId: { in: suggestedIds } },
		select: { followingId: true, state: true },
	});
	const followStates: Record<number, string> = {};
	for (const f of myFollowsOfSuggested) followStates[f.followingId] = f.state;

	return (
		<div className="flex bg-muted/20 min-h-[calc(100vh-56px)]">
			<aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-border/60">
				<LeftSidebar user={currentUser} />
			</aside>

			<main className="flex-1 py-4 px-3 overflow-hidden">
				<div className="max-w-[600px] mx-auto space-y-3">
					<StoriesBar stories={stories} currentUser={currentUser} />
					<PostComposer user={currentUser} />
					{posts.map((post) => (
						<PostCard key={post.id} post={post} currentUserId={userId} />
					))}
					{posts.length === 0 && (
						<div className="text-center py-16 text-muted-foreground">
							<p className="text-lg font-medium">No posts yet</p>
							<p className="text-sm mt-1">
								Add friends to see their posts here!
							</p>
						</div>
					)}
				</div>
			</main>

			<aside className="hidden xl:block w-[320px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-l border-border/60">
				<RightSidebar
					suggestedUsers={suggestedUsers}
					events={events}
					currentUserId={userId}
					followStates={followStates}
				/>
			</aside>
		</div>
	);
}

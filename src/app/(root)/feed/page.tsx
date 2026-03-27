import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeftSidebar } from "@/components/feed/LeftSidebar";
import { RightSidebar } from "@/components/feed/RightSidebar";
import { StoriesBar } from "@/components/feed/StoriesBar";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard } from "@/components/feed/PostCard";
import { FeedPagePostCard } from "@/components/feed/FeedPagePostCard";
import { FeedGroupPostCard } from "@/components/feed/FeedGroupPostCard";

export default async function FeedPage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);

	const [friendFollows, followedPageRows, joinedGroupRows] =
		await Promise.all([
			prisma.userFollow.findMany({
				where: { followerId: userId, state: "accepted" },
				select: { followingId: true },
			}),
			prisma.pageFollower.findMany({
				where: { userId },
				select: { pageId: true },
			}),
			prisma.groupMember.findMany({
				where: { userId, status: "Approved" },
				select: { groupId: true },
			}),
		]);

	const friendIds = friendFollows.map((f) => f.followingId);
	const allowedIds = [userId, ...friendIds];
	const followedPageIds = followedPageRows.map((r) => r.pageId);
	const joinedGroupIds = joinedGroupRows.map((r) => r.groupId);

	const [
		currentUser,
		posts,
		pagePosts,
		groupPosts,
		stories,
		suggestedUsers,
		events,
		shortcutFriends,
	] = await Promise.all([
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
				likes: {
					select: { id: true, reactionType: true, userId: true },
				},
				saves: { where: { userId }, select: { id: true } },
				_count: { select: { comments: true, shares: true } },
				hashtags: { include: { hashtag: true } },
			},
		}),
		followedPageIds.length > 0
			? prisma.pagePost.findMany({
					where: {
						pageId: { in: followedPageIds },
						isDeleted: false,
					},
					orderBy: { createdAt: "desc" },
					take: 20,
					include: {
						page: {
							select: {
								id: true,
								name: true,
								slug: true,
								avatarUrl: true,
							},
						},
						user: {
							select: {
								id: true,
								userName: true,
								firstName: true,
								lastName: true,
								avatar: { select: { photoSrc: true } },
							},
						},
						likes: {
							select: { userId: true, reactionType: true },
						},
						_count: { select: { comments: true } },
					},
				})
			: Promise.resolve([]),
		joinedGroupIds.length > 0
			? prisma.groupPost.findMany({
					where: {
						groupId: { in: joinedGroupIds },
						isDeleted: false,
					},
					orderBy: { createdAt: "desc" },
					take: 20,
					include: {
						group: {
							select: {
								id: true,
								name: true,
								slug: true,
								avatarUrl: true,
							},
						},
						user: {
							include: { avatar: true },
						},
						likes: {
							select: {
								id: true,
								userId: true,
								reactionType: true,
							},
						},
						_count: { select: { comments: true } },
					},
				})
			: Promise.resolve([]),
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
		friendIds.length > 0
			? prisma.user.findMany({
					where: { id: { in: friendIds.slice(0, 3) } },
					include: { avatar: true },
					take: 3,
			  })
			: Promise.resolve([]),
	]);

	if (!currentUser) redirect("/login");

	const suggestedIds = suggestedUsers.map((u) => u.id);
	const myFollowsOfSuggested = await prisma.userFollow.findMany({
		where: { followerId: userId, followingId: { in: suggestedIds } },
		select: { followingId: true, state: true },
	});
	const followStates: Record<number, string> = {};
	for (const f of myFollowsOfSuggested) followStates[f.followingId] = f.state;

	type FeedItem =
		| { source: "post"; createdAt: Date; data: (typeof posts)[number] }
		| {
				source: "page";
				createdAt: Date;
				data: (typeof pagePosts)[number];
		  }
		| {
				source: "group";
				createdAt: Date;
				data: (typeof groupPosts)[number];
		  };

	const feedItems: FeedItem[] = [
		...posts.map((p) => ({
			source: "post" as const,
			createdAt: p.createdAt,
			data: p,
		})),
		...pagePosts.map((p) => ({
			source: "page" as const,
			createdAt: p.createdAt,
			data: p,
		})),
		...groupPosts.map((p) => ({
			source: "group" as const,
			createdAt: p.createdAt,
			data: p,
		})),
	].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

	return (
		<div className="flex min-h-[calc(100vh-56px)]">
			<aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-border/60">
				<LeftSidebar user={currentUser} shortcuts={shortcutFriends} />
			</aside>

			<main className="flex-1 py-4 px-3 overflow-hidden">
				<div className="max-w-[600px] mx-auto space-y-3">
					<StoriesBar stories={stories} currentUser={currentUser} />
					<PostComposer user={currentUser} />
					{feedItems.map((item) => {
						if (item.source === "post") {
							return (
								<PostCard
									key={`post-${item.data.id}`}
									post={item.data}
									currentUserId={userId}
								/>
							);
						}
						if (item.source === "page") {
							return (
								<FeedPagePostCard
									key={`page-${item.data.id}`}
									post={item.data as never}
									currentUserId={userId}
								/>
							);
						}
						return (
							<FeedGroupPostCard
								key={`group-${item.data.id}`}
								post={item.data as never}
								currentUserId={userId}
							/>
						);
					})}
					{feedItems.length === 0 && (
						<div className="text-center py-16 text-muted-foreground">
							<p className="text-lg font-medium">No posts yet</p>
							<p className="text-sm mt-1">
								Follow people, pages, or join groups to see
								posts here!
							</p>
						</div>
					)}
				</div>
			</main>

			<aside className="hidden xl:block w-[320px] shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-l border-border/60">
				<RightSidebar
					suggestedUsers={suggestedUsers}
					currentUserId={userId}
					followStates={followStates}
				/>
			</aside>
		</div>
	);
}

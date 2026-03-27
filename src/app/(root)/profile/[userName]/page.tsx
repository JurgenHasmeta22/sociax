import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileContent } from "@/components/profile/ProfileContent";

type PageProps = { params: Promise<{ userName: string }> };

export async function generateMetadata({ params }: PageProps) {
	const { userName } = await params;
	const u = await prisma.user.findUnique({
		where: { userName },
		select: { firstName: true, lastName: true, userName: true },
	});
	const name = u
		? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName
		: userName;
	return { title: `${name} · Sociax` };
}

export default async function ProfilePage({ params }: PageProps) {
	const { userName } = await params;
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const user = await prisma.user.findUnique({
		where: { userName },
		include: {
			avatar: true,
			coverPhoto: true,
			_count: {
				select: {
					followers: { where: { state: "accepted" } },
					following: { where: { state: "accepted" } },
					posts: true,
				},
			},
		},
	});

	if (!user) notFound();

	const isOwnProfile = currentUserId === user.id;

	const followRecord =
		currentUserId && !isOwnProfile
			? await prisma.userFollow.findUnique({
					where: {
						followerId_followingId: {
							followerId: currentUserId,
							followingId: user.id,
						},
					},
					select: { state: true },
				})
			: null;

	const followState: "none" | "outgoing_pending" | "accepted" | null =
		isOwnProfile
			? null
			: followRecord?.state === "accepted"
				? "accepted"
				: followRecord?.state === "pending"
					? "outgoing_pending"
					: "none";

	const isFriend = followState === "accepted";
	const canViewContent =
		isOwnProfile ||
		user.profilePrivacy === "Public" ||
		(user.profilePrivacy === "FriendsOnly" && isFriend);

	const [
		posts,
		friends,
		groups,
		ownedGroups,
		followedPages,
		ownedPages,
		createdEvents,
		attendingEvents,
	] = await Promise.all([
		canViewContent
			? prisma.post.findMany({
					where: {
						userId: user.id,
						isDeleted: false,
						...(currentUserId !== null
							? {}
							: { privacy: "Public" }),
					},
					orderBy: { createdAt: "desc" },
					take: 20,
					include: {
						user: { include: { avatar: true } },
						media: { orderBy: { order: "asc" } },
						likes: {
							select: {
								id: true,
								userId: true,
								reactionType: true,
							},
						},
						saves: currentUserId
							? {
									where: { userId: currentUserId },
									select: { id: true },
								}
							: false,
						_count: { select: { comments: true, shares: true } },
						hashtags: { include: { hashtag: true } },
					},
				})
			: Promise.resolve([]),
		canViewContent
			? prisma.userFollow.findMany({
					where: { followerId: user.id, state: "accepted" },
					take: 24,
					orderBy: { createdAt: "desc" },
					include: {
						following: {
							select: {
								id: true,
								userName: true,
								firstName: true,
								lastName: true,
								avatar: { select: { photoSrc: true } },
								_count: {
									select: {
										following: {
											where: { state: "accepted" },
										},
									},
								},
							},
						},
					},
				})
			: Promise.resolve([]),
		canViewContent
			? prisma.groupMember.findMany({
					where: { userId: user.id, status: "Approved" },
					take: 12,
					include: {
						group: {
							select: {
								id: true,
								name: true,
								slug: true,
								coverUrl: true,
								avatarUrl: true,
								privacy: true,
								_count: { select: { members: true } },
							},
						},
					},
				})
			: Promise.resolve([]),
		canViewContent
			? prisma.group.findMany({
					where: { ownerId: user.id },
					take: 12,
					select: {
						id: true,
						name: true,
						slug: true,
						coverUrl: true,
						avatarUrl: true,
						privacy: true,
						_count: { select: { members: true } },
					},
				})
			: Promise.resolve([]),
		canViewContent
			? prisma.pageFollower.findMany({
					where: { userId: user.id },
					take: 12,
					include: {
						page: {
							select: {
								id: true,
								name: true,
								slug: true,
								coverUrl: true,
								avatarUrl: true,
								category: true,
								isVerified: true,
								_count: { select: { followers: true } },
							},
						},
					},
				})
			: Promise.resolve([]),
		canViewContent
			? prisma.page.findMany({
					where: { ownerId: user.id },
					take: 12,
					select: {
						id: true,
						name: true,
						slug: true,
						coverUrl: true,
						avatarUrl: true,
						category: true,
						isVerified: true,
						_count: { select: { followers: true } },
					},
				})
			: Promise.resolve([]),
		canViewContent
			? prisma.event.findMany({
					where: { creatorId: user.id },
					take: 12,
					orderBy: { startDate: "asc" },
					select: {
						id: true,
						title: true,
						slug: true,
						coverUrl: true,
						startDate: true,
						location: true,
						isOnline: true,
						privacy: true,
						_count: { select: { attendees: true } },
					},
				})
			: Promise.resolve([]),
		canViewContent
			? prisma.eventAttendee.findMany({
					where: {
						userId: user.id,
						status: { in: ["Going", "Interested"] },
						event: { startDate: { gte: new Date() } },
					},
					take: 12,
					include: {
						event: {
							select: {
								id: true,
								title: true,
								slug: true,
								coverUrl: true,
								startDate: true,
								location: true,
								isOnline: true,
								privacy: true,
								_count: { select: { attendees: true } },
							},
						},
					},
				})
			: Promise.resolve([]),
	]);

	return (
		<ProfileContent
			user={{ ...user, posts: posts as never[] }}
			isOwnProfile={isOwnProfile}
			currentUserId={currentUserId}
			followState={followState}
			canViewContent={canViewContent}
			friends={friends.map(
				(f) => (f as { following: unknown }).following as never,
			)}
			groups={groups.map((m) => (m as { group: unknown }).group as never)}
			ownedGroups={ownedGroups as never[]}
			followedPages={followedPages.map(
				(pf) => (pf as { page: unknown }).page as never,
			)}
			ownedPages={ownedPages as never[]}
			createdEvents={createdEvents as never[]}
			attendingEvents={attendingEvents.map(
				(ae) => (ae as { event: unknown }).event as never,
			)}
		/>
	);
}

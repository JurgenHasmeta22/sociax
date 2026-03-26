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
            _count: { select: { followers: true, following: true, posts: true } },
            posts: {
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
                take: 20,
                include: {
                    user: { include: { avatar: true } },
                    media: { orderBy: { order: "asc" } },
                    likes: { select: { id: true, userId: true, reactionType: true } },
                    _count: { select: { comments: true, shares: true } },
                    hashtags: { include: { hashtag: true } },
                },
            },
        },
    });

    if (!user) notFound();

    const isOwnProfile = currentUserId === user.id;

    const [followRecord, followers, following] = await Promise.all([
        currentUserId && !isOwnProfile
            ? prisma.userFollow.findUnique({
                  where: {
                      followerId_followingId: {
                          followerId: currentUserId,
                          followingId: user.id,
                      },
                  },
                  select: { state: true },
              })
            : null,
        prisma.userFollow.findMany({
            where: { followingId: user.id, state: "accepted" },
            take: 24,
            orderBy: { createdAt: "desc" },
            include: {
                follower: {
                    select: {
                        id: true,
                        userName: true,
                        firstName: true,
                        lastName: true,
                        avatar: { select: { photoSrc: true } },
                        _count: { select: { followers: true } },
                    },
                },
            },
        }),
        prisma.userFollow.findMany({
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
                        _count: { select: { followers: true } },
                    },
                },
            },
        }),
    ]);

    const followState: "none" | "outgoing_pending" | "accepted" | null = isOwnProfile
        ? null
        : followRecord?.state === "accepted"
          ? "accepted"
          : followRecord?.state === "pending"
            ? "outgoing_pending"
            : "none";

    return (
        <ProfileContent
            user={user}
            isOwnProfile={isOwnProfile}
            currentUserId={currentUserId}
            followState={followState}
            followers={followers.map((f) => f.follower)}
            following={following.map((f) => f.following)}
        />
    );
}

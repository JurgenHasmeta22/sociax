import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileContent } from "@/components/profile/ProfileContent";

type PageProps = { params: Promise<{ userName: string }> };

export async function generateMetadata({ params }: PageProps) {
    const { userName } = await params;
    return { title: `${userName} · Sociax` };
}

export default async function ProfilePage({ params }: PageProps) {
    const { userName } = await params;
    const session = await getServerSession(authOptions);

    const user = await prisma.user.findUnique({
        where: { userName },
        include: {
            avatar: true,
            coverPhoto: true,
            _count: {
                select: { followers: true, following: true, posts: true },
            },
            posts: {
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
                take: 12,
                include: {
                    media: { select: { id: true, url: true }, orderBy: { order: "asc" } },
                    likes: { select: { id: true } },
                    _count: { select: { comments: true } },
                },
            },
        },
    });

    if (!user) notFound();

    const isOwnProfile = session?.user?.name === user.userName;

    return <ProfileContent user={user} isOwnProfile={isOwnProfile} />;
}

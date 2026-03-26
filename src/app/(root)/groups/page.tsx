import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, Lock, Users, UserPlus, Plus } from "lucide-react";

export const metadata = { title: "Groups · Sociax" };

const PRIVACY_CONFIG = {
    Public: { icon: Globe, label: "Public" },
    Private: { icon: Lock, label: "Private" },
    Secret: { icon: Lock, label: "Secret" },
} as const;

export default async function GroupsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const groups = await prisma.group.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            owner: { include: { avatar: true } },
            _count: { select: { members: true, posts: true } },
        },
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Groups</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Discover and join communities
                    </p>
                </div>
                <Button className="gap-2 font-semibold">
                    <Plus className="h-4 w-4" />
                    Create group
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                    const privacyKey = group.privacy as keyof typeof PRIVACY_CONFIG;
                    const { icon: PrivacyIcon, label: privacyLabel } =
                        PRIVACY_CONFIG[privacyKey] ?? PRIVACY_CONFIG.Public;
                    const ownerName =
                        [group.owner.firstName, group.owner.lastName]
                            .filter(Boolean)
                            .join(" ") || group.owner.userName;

                    return (
                        <Card
                            key={group.id}
                            className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="relative h-36 bg-muted">
                                {group.coverUrl ? (
                                    <Image
                                        src={group.coverUrl}
                                        alt={group.name}
                                        fill
                                        className="object-cover"
                                        sizes="400px"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        <Users className="h-12 w-12 text-primary/40" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge
                                        variant="secondary"
                                        className="gap-1 text-xs bg-background/90 backdrop-blur"
                                    >
                                        <PrivacyIcon className="h-3 w-3" />
                                        {privacyLabel}
                                    </Badge>
                                </div>
                                {group.avatarUrl && (
                                    <div className="absolute -bottom-5 left-4">
                                        <div className="relative w-10 h-10 rounded-full ring-2 ring-background overflow-hidden bg-muted">
                                            <Image
                                                src={group.avatarUrl}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                sizes="40px"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <CardContent className="pt-7 pb-4">
                                <h3 className="font-bold text-base leading-tight truncate">
                                    {group.name}
                                </h3>
                                {group.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                        {group.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        {group._count.members.toLocaleString()} members
                                    </span>
                                    <span>{group._count.posts} posts</span>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <Link href={`/profile/${group.owner.userName}`}>
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage
                                                src={group.owner.avatar?.photoSrc ?? undefined}
                                            />
                                            <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                                                {ownerName[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <span className="text-xs text-muted-foreground truncate">
                                        by{" "}
                                        <Link
                                            href={`/profile/${group.owner.userName}`}
                                            className="font-medium text-foreground hover:underline"
                                        >
                                            {ownerName}
                                        </Link>
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full mt-3 gap-1.5 font-semibold"
                                >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Join group
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {groups.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-lg">No groups yet</p>
                    <p className="text-sm mt-1">Create the first group on Sociax!</p>
                </div>
            )}
        </div>
    );
}

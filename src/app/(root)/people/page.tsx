import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, UserPlus, Users } from "lucide-react";

export const metadata = { title: "People · Sociax" };

export default async function PeoplePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const userId = parseInt(session.user.id);

    const people = await prisma.user.findMany({
        where: { id: { not: userId }, active: true },
        orderBy: { createdAt: "desc" },
        include: {
            avatar: true,
            _count: { select: { followers: true, posts: true } },
        },
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">People</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Discover people to connect with
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input placeholder="Search people..." className="pl-9 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {people.map((person) => {
                    const name =
                        [person.firstName, person.lastName].filter(Boolean).join(" ") ||
                        person.userName;
                    return (
                        <Card
                            key={person.id}
                            className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <Link href={`/profile/${person.userName}`}>
                                <div className="relative h-28 bg-muted">
                                    {person.avatar ? (
                                        <Avatar className="w-full h-full rounded-none">
                                            <AvatarImage
                                                src={person.avatar.photoSrc}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="rounded-none text-3xl bg-primary text-primary-foreground h-full w-full">
                                                {name[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-4xl font-bold text-primary/40">
                                                {name[0]?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <CardContent className="p-3">
                                <Link href={`/profile/${person.userName}`}>
                                    <p className="font-semibold text-sm leading-tight truncate hover:underline">
                                        {name}
                                    </p>
                                </Link>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    @{person.userName}
                                </p>
                                {person.location && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        {person.location}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {person._count.followers}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                                        {person._count.posts} posts
                                    </Badge>
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full mt-3 gap-1.5 h-7 text-xs font-semibold"
                                >
                                    <UserPlus className="h-3 w-3" />
                                    Add friend
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {people.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-lg">No people to show</p>
                    <p className="text-sm mt-1">You&apos;ve connected with everyone!</p>
                </div>
            )}
        </div>
    );
}

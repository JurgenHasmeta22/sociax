"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    MapPin,
    Link as LinkIcon,
    CalendarDays,
    UserPlus,
    UserCheck,
    Clock,
    MessageCircle,
    MoreHorizontal,
    Users,
} from "lucide-react";
import { format } from "date-fns";
import {
    sendFollowRequest,
    cancelFollowRequest,
    unfollowUser,
} from "@/actions/follow.actions";
import { PostCard } from "@/components/feed/PostCard";

type FriendUser = {
    id: number;
    userName: string;
    firstName: string | null;
    lastName: string | null;
    avatar: { photoSrc: string } | null;
    _count: { followers: number };
};

type Post = {
    id: number;
    content: string | null;
    createdAt: Date;
    privacy: string;
    user: {
        id: number;
        userName: string;
        firstName: string | null;
        lastName: string | null;
        avatar: { photoSrc: string } | null;
    };
    media: { id: number; url: string; type: string; order: number }[];
    likes: { id: number; userId: number; reactionType: string }[];
    _count: { comments: number; shares: number };
    hashtags: { hashtag: { id: number; name: string } }[];
};

type ProfileUser = {
    id: number;
    userName: string;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    birthday: Date | null;
    gender: string;
    avatar: { photoSrc: string } | null;
    coverPhoto: { photoSrc: string } | null;
    _count: { followers: number; following: number; posts: number };
    posts: Post[];
};

const TABS = ["Posts", "About", "Followers", "Following"] as const;
type Tab = (typeof TABS)[number];

const displayName = (u: { firstName: string | null; lastName: string | null; userName: string }) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

function FriendGrid({ people, emptyLabel }: { people: FriendUser[]; emptyLabel: string }) {
    if (people.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{emptyLabel}</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {people.map((person) => {
                const n = displayName(person);
                return (
                    <Link
                        key={person.id}
                        href={`/profile/${person.userName}`}
                        className="group block"
                    >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                            <div className="relative h-24 bg-muted">
                                <Avatar className="w-full h-full rounded-none">
                                    <AvatarImage
                                        src={person.avatar?.photoSrc ?? undefined}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-none text-2xl bg-primary text-primary-foreground h-full w-full">
                                        {n[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardContent className="p-2.5">
                                <p className="font-semibold text-sm leading-tight truncate group-hover:underline">
                                    {n}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {person._count.followers} followers
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}

export function ProfileContent({
    user,
    isOwnProfile,
    currentUserId,
    followState: initialFollowState,
    followers,
    following,
}: {
    user: ProfileUser;
    isOwnProfile: boolean;
    currentUserId: number | null;
    followState: "none" | "outgoing_pending" | "accepted" | null;
    followers: FriendUser[];
    following: FriendUser[];
}) {
    const [activeTab, setActiveTab] = useState<Tab>("Posts");
    const [followState, setFollowState] = useState(initialFollowState);
    const [isPending, startTransition] = useTransition();
    const name = displayName(user);

    const handleFollow = () => {
        if (!currentUserId) return;
        if (followState === "none") {
            setFollowState("outgoing_pending");
            startTransition(() => sendFollowRequest(user.id));
        } else if (followState === "outgoing_pending") {
            setFollowState("none");
            startTransition(() => cancelFollowRequest(user.id));
        } else if (followState === "accepted") {
            setFollowState("none");
            startTransition(() => unfollowUser(user.id));
        }
    };

    return (
        <div>
            <div className="relative bg-muted h-64 md:h-80 overflow-hidden">
                {user.coverPhoto ? (
                    <Image
                        src={user.coverPhoto.photoSrc}
                        alt="Cover"
                        fill
                        className="object-cover"
                        sizes="100vw"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                )}
            </div>

            <div className="max-w-5xl mx-auto px-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-12 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="relative w-40 h-40 rounded-full ring-4 ring-background overflow-hidden bg-muted shrink-0">
                            {user.avatar ? (
                                <Image
                                    src={user.avatar.photoSrc}
                                    alt={name}
                                    fill
                                    className="object-cover"
                                    sizes="160px"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-5xl font-bold">
                                    {name[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="pb-2">
                            <h1 className="text-2xl font-bold leading-tight">{name}</h1>
                            <p className="text-muted-foreground text-sm">@{user.userName}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <button
                                    onClick={() => setActiveTab("Followers")}
                                    className="hover:underline"
                                >
                                    <span className="font-semibold text-foreground">
                                        {user._count.followers.toLocaleString()}
                                    </span>{" "}
                                    followers
                                </button>
                                <button
                                    onClick={() => setActiveTab("Following")}
                                    className="hover:underline"
                                >
                                    <span className="font-semibold text-foreground">
                                        {user._count.following.toLocaleString()}
                                    </span>{" "}
                                    following
                                </button>
                                <span>
                                    <span className="font-semibold text-foreground">
                                        {user._count.posts.toLocaleString()}
                                    </span>{" "}
                                    posts
                                </span>
                            </div>
                            {user.bio && (
                                <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
                                    {user.bio}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pb-2">
                        {isOwnProfile ? (
                            <Button variant="secondary" className="gap-2 font-semibold">
                                Edit profile
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleFollow}
                                    disabled={isPending || !currentUserId}
                                    className="gap-2 font-semibold"
                                    variant={followState === "accepted" ? "secondary" : "default"}
                                >
                                    {followState === "accepted" ? (
                                        <>
                                            <UserCheck className="h-4 w-4" />
                                            Following
                                        </>
                                    ) : followState === "outgoing_pending" ? (
                                        <>
                                            <Clock className="h-4 w-4" />
                                            Requested
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-4 w-4" />
                                            Follow
                                        </>
                                    )}
                                </Button>
                                <Button variant="secondary" className="gap-2 font-semibold">
                                    <MessageCircle className="h-4 w-4" />
                                    Message
                                </Button>
                                <Button variant="secondary" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                    {user.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {user.location}
                        </span>
                    )}
                    {user.website && (
                        <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                        >
                            <LinkIcon className="h-4 w-4" />
                            {user.website.replace(/^https?:\/\//, "")}
                        </a>
                    )}
                    {user.birthday && (
                        <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            Born {format(new Date(user.birthday), "MMMM d, yyyy")}
                        </span>
                    )}
                </div>

                <Separator />

                <div className="flex gap-1 mt-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-4 py-3 text-sm font-semibold rounded-md transition-colors ${
                                activeTab === tab
                                    ? "text-primary"
                                    : "text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
                <Separator className="mb-6" />

                {activeTab === "Posts" && (
                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 pb-10">
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="pt-4 pb-4">
                                    <h3 className="font-semibold mb-3">Intro</h3>
                                    {user.bio && (
                                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                                            {user.bio}
                                        </p>
                                    )}
                                    <div className="space-y-2 text-sm">
                                        {user.location && (
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4 shrink-0" />
                                                Lives in{" "}
                                                <span className="font-medium text-foreground">
                                                    {user.location}
                                                </span>
                                            </p>
                                        )}
                                        {user.birthday && (
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <CalendarDays className="h-4 w-4 shrink-0" />
                                                Born{" "}
                                                <span className="font-medium text-foreground">
                                                    {format(new Date(user.birthday), "MMMM d, yyyy")}
                                                </span>
                                            </p>
                                        )}
                                        {user.website && (
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <LinkIcon className="h-4 w-4 shrink-0" />
                                                <a
                                                    href={user.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline truncate"
                                                >
                                                    {user.website.replace(/^https?:\/\//, "")}
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                    <Separator className="my-3" />
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <button
                                            onClick={() => setActiveTab("Followers")}
                                            className="hover:underline"
                                        >
                                            {user._count.followers} followers
                                        </button>
                                        <Badge variant="secondary">{user.gender}</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {followers.length > 0 && (
                                <Card>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">Followers</h3>
                                            <button
                                                onClick={() => setActiveTab("Followers")}
                                                className="text-primary text-xs hover:underline"
                                            >
                                                See all
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {followers.slice(0, 9).map((f) => {
                                                const n = displayName(f);
                                                return (
                                                    <Link
                                                        key={f.id}
                                                        href={`/profile/${f.userName}`}
                                                        className="flex flex-col items-center gap-1 group"
                                                    >
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage
                                                                src={f.avatar?.photoSrc ?? undefined}
                                                            />
                                                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                                                {n[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-[10px] text-center leading-tight text-muted-foreground group-hover:text-foreground truncate w-full text-center">
                                                            {n.split(" ")[0]}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-3">
                            {user.posts.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                                    <p className="font-medium">No posts yet</p>
                                </div>
                            ) : currentUserId ? (
                                user.posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        currentUserId={currentUserId}
                                    />
                                ))
                            ) : (
                                user.posts.map((post) => (
                                    <Card key={post.id} className="shadow-sm">
                                        <CardContent className="pt-4">
                                            {post.content && (
                                                <p className="text-sm leading-relaxed">
                                                    {post.content}
                                                </p>
                                            )}
                                            {post.media.length > 0 && (
                                                <div className="relative mt-3 h-64 rounded-lg overflow-hidden bg-muted">
                                                    <Image
                                                        src={post.media[0].url}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                        sizes="600px"
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "About" && (
                    <div className="max-w-2xl mx-auto pb-10">
                        <Card>
                            <CardContent className="pt-6 space-y-5">
                                <div>
                                    <h3 className="font-semibold mb-4 text-primary">Overview</h3>
                                    <div className="space-y-3 text-sm">
                                        {user.bio && (
                                            <div className="flex gap-3">
                                                <span className="text-muted-foreground w-24 shrink-0">
                                                    Bio
                                                </span>
                                                <span>{user.bio}</span>
                                            </div>
                                        )}
                                        {user.location && (
                                            <div className="flex gap-3">
                                                <span className="text-muted-foreground w-24 shrink-0">
                                                    Location
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    {user.location}
                                                </span>
                                            </div>
                                        )}
                                        {user.birthday && (
                                            <div className="flex gap-3">
                                                <span className="text-muted-foreground w-24 shrink-0">
                                                    Birthday
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                                    {format(
                                                        new Date(user.birthday),
                                                        "MMMM d, yyyy",
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            <span className="text-muted-foreground w-24 shrink-0">
                                                Gender
                                            </span>
                                            <Badge variant="secondary">{user.gender}</Badge>
                                        </div>
                                        {user.website && (
                                            <div className="flex gap-3">
                                                <span className="text-muted-foreground w-24 shrink-0">
                                                    Website
                                                </span>
                                                <a
                                                    href={user.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                                                    {user.website.replace(/^https?:\/\//, "")}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex gap-6 text-sm">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">
                                            {user._count.posts}
                                        </p>
                                        <p className="text-muted-foreground">Posts</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">
                                            {user._count.followers.toLocaleString()}
                                        </p>
                                        <p className="text-muted-foreground">Followers</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">
                                            {user._count.following.toLocaleString()}
                                        </p>
                                        <p className="text-muted-foreground">Following</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "Followers" && (
                    <div className="pb-10">
                        <h2 className="text-base font-semibold mb-4">
                            {user._count.followers.toLocaleString()} Followers
                        </h2>
                        <FriendGrid
                            people={followers}
                            emptyLabel="No followers yet"
                        />
                    </div>
                )}

                {activeTab === "Following" && (
                    <div className="pb-10">
                        <h2 className="text-base font-semibold mb-4">
                            Following {user._count.following.toLocaleString()}
                        </h2>
                        <FriendGrid
                            people={following}
                            emptyLabel="Not following anyone yet"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
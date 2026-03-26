"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ThumbsUp,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Globe,
    Users,
    Lock,
    Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REACTIONS: Record<string, { emoji: string; color: string }> = {
    Like: { emoji: "👍", color: "text-primary" },
    Love: { emoji: "❤️", color: "text-red-500" },
    Haha: { emoji: "😂", color: "text-yellow-500" },
    Wow: { emoji: "😮", color: "text-yellow-400" },
    Sad: { emoji: "😢", color: "text-yellow-400" },
    Angry: { emoji: "😠", color: "text-orange-500" },
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
    likes: { id: number; reactionType: string }[];
    _count: { comments: number; shares: number };
    hashtags: { hashtag: { id: number; name: string } }[];
};

const displayName = (u: { firstName: string | null; lastName: string | null; userName: string }) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes.length);

    const name = displayName(post.user);
    const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

    const PrivacyIcon =
        post.privacy === "Public" ? Globe : post.privacy === "FriendsOnly" ? Users : Lock;

    const reactionCounts: Record<string, number> = {};
    post.likes.forEach((l) => {
        reactionCounts[l.reactionType] = (reactionCounts[l.reactionType] || 0) + 1;
    });
    const topReactions = Object.entries(reactionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

    const handleLike = () => {
        setLiked((p) => !p);
        setLikeCount((p) => (liked ? p - 1 : p + 1));
    };

    return (
        <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <CardContent className="pt-4 pb-0">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/profile/${post.user.userName}`}>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={post.user.avatar?.photoSrc ?? undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                    {name[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <Link
                                href={`/profile/${post.user.userName}`}
                                className="font-semibold text-sm hover:underline leading-tight block"
                            >
                                {name}
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <span>{timeAgo}</span>
                                <span>·</span>
                                <PrivacyIcon className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-muted-foreground"
                        >
                            <Bookmark className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-muted-foreground"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Save post</DropdownMenuItem>
                                <DropdownMenuItem>Hide post</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    Report post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {post.content && (
                    <p className="mt-3 text-sm leading-relaxed">{post.content}</p>
                )}
                {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {post.hashtags.map(({ hashtag }) => (
                            <span
                                key={hashtag.id}
                                className="text-primary text-sm hover:underline cursor-pointer"
                            >
                                #{hashtag.name}
                            </span>
                        ))}
                    </div>
                )}
            </CardContent>

            {post.media.length > 0 && (
                <div className="mt-3">
                    {post.media.length === 1 ? (
                        <div className="relative w-full aspect-video bg-muted">
                            <Image
                                src={post.media[0].url}
                                alt="Post media"
                                fill
                                className="object-cover"
                                sizes="600px"
                            />
                        </div>
                    ) : (
                        <div className={cn("grid gap-0.5", post.media.length === 2 ? "grid-cols-2" : "grid-cols-2")}>
                            {post.media.slice(0, 4).map((m, i) => (
                                <div key={m.id} className="relative h-48 bg-muted">
                                    <Image
                                        src={m.url}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="300px"
                                    />
                                    {i === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-2xl">
                                            +{post.media.length - 4}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <CardContent className="pt-3 pb-2">
                {(likeCount > 0 || post._count.comments > 0 || post._count.shares > 0) && (
                    <>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1.5">
                                {topReactions.length > 0 && (
                                    <div className="flex -space-x-1">
                                        {topReactions.map((r) => (
                                            <span key={r} className="text-base leading-none">
                                                {REACTIONS[r]?.emoji}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {likeCount > 0 && (
                                    <span className="hover:underline cursor-pointer">
                                        {likeCount.toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {post._count.comments > 0 && (
                                    <button className="hover:underline">
                                        {post._count.comments} comments
                                    </button>
                                )}
                                {post._count.shares > 0 && (
                                    <button className="hover:underline">
                                        {post._count.shares} shares
                                    </button>
                                )}
                            </div>
                        </div>
                        <Separator className="mb-1" />
                    </>
                )}
                <div className="flex items-center justify-between -mx-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={cn(
                            "flex-1 gap-2 rounded-lg font-semibold text-sm h-9",
                            liked
                                ? "text-primary hover:text-primary"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <ThumbsUp
                            className={cn("h-[18px] w-[18px]", liked && "fill-current")}
                        />
                        {liked ? "Liked" : "Like"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:text-foreground rounded-lg font-semibold text-sm h-9"
                    >
                        <MessageCircle className="h-[18px] w-[18px]" />
                        Comment
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:text-foreground rounded-lg font-semibold text-sm h-9"
                    >
                        <Share2 className="h-[18px] w-[18px]" />
                        Share
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

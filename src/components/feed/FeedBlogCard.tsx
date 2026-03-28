"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, BookOpen, ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import { toggleBlogLike } from "@/actions/blog.actions";
import { cn } from "@/lib/utils";

export type FeedBlogItem = {
	id: number;
	slug: string;
	title: string;
	excerpt: string | null;
	coverImageUrl: string | null;
	createdAt: Date;
	author: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	hashtags: { hashtag: { id: number; name: string } }[];
	_count: { likes: number; comments: number };
};

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function FeedBlogCard({ post }: { post: FeedBlogItem }) {
	const authorName = displayName(post.author);
	const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
		addSuffix: true,
	});
	const [likeCount, setLikeCount] = useState(post._count.likes);
	const [isLiked, setIsLiked] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleLike = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsLiked((prev) => !prev);
		setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
		startTransition(() => void toggleBlogLike(post.id));
	};

	return (
		<Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-border/50">
			<CardContent className="pt-4 pb-0">
				<div className="flex items-center gap-3 mb-3">
					<Link href={`/profile/${post.author.userName}`}>
						<Avatar className="h-10 w-10">
							<AvatarImage
								src={post.author.avatar?.photoSrc ?? undefined}
							/>
							<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
								{authorName[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>
					<div>
						<Link
							href={`/profile/${post.author.userName}`}
							className="font-semibold text-sm hover:underline leading-tight block"
						>
							{authorName}
						</Link>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
							<span>{timeAgo}</span>
							<span>·</span>
							<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
								<BookOpen className="h-2.5 w-2.5 mr-0.5" />
								Blog
							</Badge>
						</div>
					</div>
				</div>
			</CardContent>

			{post.coverImageUrl && (
				<Link href={`/blog/${post.slug}`} className="block">
					<div className="relative w-full aspect-video bg-muted mt-2">
						<Image
							src={post.coverImageUrl}
							alt={post.title}
							fill
							className="object-cover hover:opacity-95 transition-opacity"
							sizes="600px"
						/>
					</div>
				</Link>
			)}

			<CardContent className="pt-3 pb-0">
				<Link href={`/blog/${post.slug}`} className="group block">
					<h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
						{post.title}
					</h3>
					{post.excerpt && (
						<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-2">
							{post.excerpt}
						</p>
					)}
				</Link>
				{post.hashtags.length > 0 && (
					<div className="flex flex-wrap gap-1 mb-2">
						{post.hashtags.slice(0, 4).map(({ hashtag }) => (
							<Link
								key={hashtag.id}
								href={`/hashtags/${hashtag.name}`}
								className="text-primary text-xs hover:underline font-medium"
							>
								#{hashtag.name}
							</Link>
						))}
					</div>
				)}
				{likeCount > 0 && (
					<>
						<p className="text-xs text-muted-foreground mb-2">
							{likeCount.toLocaleString()} like{likeCount !== 1 ? "s" : ""}
						</p>
					</>
				)}
			</CardContent>

			<CardContent className="pt-1 pb-2">
				<Separator className="mb-2" />
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLike}
						disabled={isPending}
						className={cn(
							"flex-1 gap-2 rounded-lg font-semibold text-sm h-9",
							isLiked
								? "text-primary hover:text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-current")} />
						{isLiked ? "Liked" : "Like"}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="flex-1 gap-2 text-muted-foreground hover:text-foreground rounded-lg font-semibold text-sm h-9"
					>
						<Link href={`/blog/${post.slug}`}>
							<MessageCircle className="h-[18px] w-[18px]" />
							{post._count.comments > 0
								? `${post._count.comments} Comments`
								: "Comment"}
						</Link>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="flex-1 gap-2 text-primary hover:text-primary rounded-lg font-semibold text-sm h-9"
					>
						<Link href={`/blog/${post.slug}`}>
							Read more <ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

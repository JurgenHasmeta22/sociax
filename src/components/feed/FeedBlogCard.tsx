"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, BookOpen, ArrowRight } from "lucide-react";
import Image from "next/image";

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

	return (
		<Link href={`/blog/${post.slug}`} className="block group">
			<Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-border/50">
				<CardContent className="pt-4 pb-0">
					<div className="flex items-center gap-3 mb-3">
						<Link
							href={`/profile/${post.author.userName}`}
							onClick={(e) => e.stopPropagation()}
						>
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
								onClick={(e) => e.stopPropagation()}
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
					<div className="relative w-full aspect-video bg-muted mt-2">
						<Image
							src={post.coverImageUrl}
							alt={post.title}
							fill
							className="object-cover"
							sizes="600px"
						/>
					</div>
				)}

				<CardContent className="pt-3 pb-3">
					<h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
						{post.title}
					</h3>
					{post.excerpt && (
						<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-2">
							{post.excerpt}
						</p>
					)}
					{post.hashtags.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-2">
							{post.hashtags.slice(0, 4).map(({ hashtag }) => (
								<Link
									key={hashtag.id}
									href={`/hashtags/${hashtag.name}`}
									onClick={(e) => e.stopPropagation()}
									className="text-primary text-xs hover:underline font-medium"
								>
									#{hashtag.name}
								</Link>
							))}
						</div>
					)}
					<Separator className="mb-3" />
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span className="flex items-center gap-1">
							<Heart className="h-4 w-4" />
							{post._count.likes.toLocaleString()} likes
						</span>
						<span className="flex items-center gap-1 ml-auto text-primary text-xs font-semibold">
							Read more <ArrowRight className="h-3 w-3" />
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

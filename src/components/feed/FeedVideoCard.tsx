"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Play, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayerModal } from "@/components/feed/VideoPlayerModal";

export type FeedVideoItem = {
	id: number;
	title: string;
	url: string;
	thumbnailUrl: string | null;
	views: number;
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

export function FeedVideoCard({
	video,
	currentUserId,
}: {
	video: FeedVideoItem;
	currentUserId: number;
}) {
	const [playerOpen, setPlayerOpen] = useState(false);
	const authorName = displayName(video.author);
	const timeAgo = formatDistanceToNow(new Date(video.createdAt), {
		addSuffix: true,
	});

	return (
		<>
			<Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-border/50">
				<CardContent className="pt-4 pb-0">
					<div className="flex items-center gap-3 mb-3">
						<Link href={`/profile/${video.author.userName}`}>
							<Avatar className="h-10 w-10">
								<AvatarImage
									src={
										video.author.avatar?.photoSrc ??
										undefined
									}
								/>
								<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
									{authorName[0]?.toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</Link>
						<div>
							<Link
								href={`/profile/${video.author.userName}`}
								className="font-semibold text-sm hover:underline leading-tight block"
							>
								{authorName}
							</Link>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
								<span>{timeAgo}</span>
								<span>·</span>
								<Badge
									variant="secondary"
									className="text-[10px] px-1.5 py-0.5"
								>
									<Play className="h-2.5 w-2.5 mr-0.5" />
									Video
								</Badge>
							</div>
						</div>
					</div>

					<p className="font-semibold text-sm mb-2">{video.title}</p>

					{video.hashtags.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-2">
							{video.hashtags.slice(0, 4).map(({ hashtag }) => (
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
				</CardContent>

				{/* Thumbnail / video preview */}
				<button
					onClick={() => setPlayerOpen(true)}
					className="w-full mt-2 relative aspect-video bg-muted group"
				>
					{video.thumbnailUrl ? (
						<img
							src={video.thumbnailUrl}
							alt={video.title}
							className="w-full h-full object-cover"
						/>
					) : (
						<video
							src={video.url}
							className="w-full h-full object-cover"
							preload="metadata"
						/>
					)}
					<div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
						<div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/60">
							<Play className="h-7 w-7 text-white fill-white ml-1" />
						</div>
					</div>
					<div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
						<Eye className="h-3 w-3" />
						{video.views.toLocaleString()}
					</div>
				</button>

				<CardContent className="pt-3 pb-3">
					<Separator className="mb-3" />
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span className="flex items-center gap-1">
							<Heart className="h-4 w-4" />
							{video._count.likes.toLocaleString()} likes
						</span>
						<span className="flex items-center gap-1">
							<MessageCircle className="h-4 w-4" />
							{video._count.comments.toLocaleString()} comments
						</span>
						<Link
							href={`/videos/${video.id}`}
							className="ml-auto text-primary text-xs font-semibold hover:underline"
						>
							Watch on Videos →
						</Link>
					</div>
				</CardContent>
			</Card>

			{playerOpen && (
				<VideoPlayerModal
					video={{
						id: video.id,
						title: video.title,
						description: null,
						url: video.url,
						thumbnailUrl: video.thumbnailUrl,
						views: video.views,
						isLiked: false,
						createdAt: video.createdAt,
						author: video.author,
						hashtags: video.hashtags,
						comments: [],
						_count: video._count,
					}}
					currentUserId={currentUserId}
					onClose={() => setPlayerOpen(false)}
				/>
			)}
		</>
	);
}

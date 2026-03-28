"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Play, Trash2 } from "lucide-react";
import { getVideoById, deleteVideo } from "@/actions/video.actions";
import { VideoPlayerModal } from "./VideoPlayerModal";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type VideoCardProps = {
	video: {
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
	currentUserId?: number;
};

export function VideoCard({ video, currentUserId }: VideoCardProps) {
	const [showPlayer, setShowPlayer] = useState(false);
	const [videoDetail, setVideoDetail] = useState<Awaited<ReturnType<typeof getVideoById>> | null>(null);
	const [loading, setLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	const authorName = [video.author.firstName, video.author.lastName].filter(Boolean).join(" ") || video.author.userName;

	async function handlePlay() {
		setLoading(true);
		try {
			const detail = await getVideoById(video.id);
			setVideoDetail(detail);
			setShowPlayer(true);
		} catch {
			toast.error("Failed to load video");
		} finally {
			setLoading(false);
		}
	}

	function handleDelete(e: React.MouseEvent) {
		e.stopPropagation();
		if (!confirm("Delete this video?")) return;
		startTransition(async () => {
			try {
				await deleteVideo(video.id);
				toast.success("Video deleted");
				window.location.reload();
			} catch {
				toast.error("Failed to delete video");
			}
		});
	}

	return (
		<>
			<Card className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow" onClick={handlePlay}>
				{/* Thumbnail */}
				<div className="relative aspect-video bg-muted">
					{video.thumbnailUrl ? (
						<Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover transition-transform group-hover:scale-105" />
					) : (
						<video
							src={video.url}
							className="w-full h-full object-cover"
							muted
							preload="metadata"
						/>
					)}
					{/* Play overlay */}
					<div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
						{loading ? (
							<div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
								<div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						) : (
							<div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
								<Play className="h-5 w-5 text-black fill-black ml-0.5" />
							</div>
						)}
					</div>
					{/* Delete button for own videos */}
					{currentUserId === video.author.id && (
						<button
							onClick={handleDelete}
							disabled={isPending}
							className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
						>
							<Trash2 className="h-3.5 w-3.5 text-white" />
						</button>
					)}
					{/* Stats overlay at bottom */}
					<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent py-2 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
						<div className="flex items-center gap-2 text-white text-xs">
							<span className="flex items-center gap-1"><Heart className="h-3 w-3" />{video._count.likes}</span>
							<span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{video._count.comments}</span>
						</div>
					</div>
				</div>

				{/* Info */}
				<div className="p-3">
					<h3 className="font-semibold text-sm line-clamp-2 leading-tight">{video.title}</h3>
					<div className="flex items-center gap-1.5 mt-1.5">
						<Avatar className="h-5 w-5">
							<AvatarImage src={video.author.avatar?.photoSrc ?? undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
								{authorName[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<Link href={`/profile/${video.author.userName}`} onClick={(e) => e.stopPropagation()} className="text-xs text-muted-foreground hover:underline truncate">
							{authorName}
						</Link>
						<span className="text-xs text-muted-foreground ml-auto shrink-0">{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
					</div>
					{video.hashtags.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-1.5">
							{video.hashtags.slice(0, 3).map(({ hashtag }) => (
								<Link key={hashtag.id} href={`/hashtags/${hashtag.name}`} onClick={(e) => e.stopPropagation()} className="text-primary text-xs hover:underline font-medium">
									#{hashtag.name}
								</Link>
							))}
						</div>
					)}
				</div>
			</Card>

			{showPlayer && videoDetail && (
				<VideoPlayerModal
					video={videoDetail}
					currentUserId={currentUserId}
					onClose={() => { setShowPlayer(false); setVideoDetail(null); }}
				/>
			)}
		</>
	);
}

"use client";

import { useState, useRef, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, X, Send, Loader2, Hash, Trash2 } from "lucide-react";
import { toggleVideoLike, addVideoComment, deleteVideo } from "@/actions/video.actions";
import { toast } from "sonner";

type VideoComment = {
	id: number;
	content: string;
	createdAt: Date;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};

type VideoDetail = {
	id: number;
	title: string;
	description: string | null;
	url: string;
	thumbnailUrl: string | null;
	views: number;
	isLiked: boolean;
	createdAt: Date;
	author: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	hashtags: { hashtag: { id: number; name: string } }[];
	comments: VideoComment[];
	_count: { likes: number; comments: number };
};

export function VideoPlayerModal({
	video: initialVideo,
	currentUserId,
	onClose,
}: {
	video: VideoDetail;
	currentUserId?: number;
	onClose: () => void;
}) {
	const [video, setVideo] = useState(initialVideo);
	const [commentText, setCommentText] = useState("");
	const [comments, setComments] = useState<VideoComment[]>(video.comments);
	const [isLiked, setIsLiked] = useState(video.isLiked);
	const [likeCount, setLikeCount] = useState(video._count.likes);
	const [isPending, startTransition] = useTransition();
	const videoRef = useRef<HTMLVideoElement>(null);

	const authorName = [video.author.firstName, video.author.lastName].filter(Boolean).join(" ") || video.author.userName;

	function handleLike() {
		startTransition(async () => {
			const result = await toggleVideoLike(video.id);
			setIsLiked(result.liked);
			setLikeCount((c) => c + (result.liked ? 1 : -1));
		});
	}

	function handleComment() {
		if (!commentText.trim()) return;
		startTransition(async () => {
			try {
				const newComment = await addVideoComment(video.id, commentText);
				setComments((prev) => [newComment, ...prev]);
				setCommentText("");
				toast.success("Comment added");
			} catch {
				toast.error("Failed to add comment");
			}
		});
	}

	function handleDelete() {
		if (!confirm("Delete this video?")) return;
		startTransition(async () => {
			try {
				await deleteVideo(video.id);
				toast.success("Video deleted");
				onClose();
			} catch {
				toast.error("Failed to delete video");
			}
		});
	}

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row h-[90vh]">
				{/* Video player */}
				<div className="flex-1 bg-black flex items-center min-h-[240px]">
					<video
						ref={videoRef}
						src={video.url}
						poster={video.thumbnailUrl ?? undefined}
						controls
						autoPlay
						className="w-full max-h-[90vh] object-contain"
					/>
				</div>

				{/* Sidebar */}
				<div className="w-full md:w-80 flex flex-col h-full border-l">
					{/* Header */}
					<div className="flex items-center justify-between p-3 border-b shrink-0">
						<div className="flex items-center gap-2">
							<Link href={`/profile/${video.author.userName}`} className="shrink-0">
								<Avatar className="h-8 w-8">
									<AvatarImage src={video.author.avatar?.photoSrc ?? undefined} />
									<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
										{authorName[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</Link>
							<div className="min-w-0">
								<Link href={`/profile/${video.author.userName}`} className="font-semibold text-sm hover:underline line-clamp-1">
									{authorName}
								</Link>
								<p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</p>
							</div>
						</div>
						{currentUserId === video.author.id && (
							<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete}>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						)}
					</div>

					{/* Info */}
					<div className="p-3 border-b shrink-0">
						<h2 className="font-semibold text-sm leading-snug">{video.title}</h2>
						{video.description && (
							<p className="text-sm text-muted-foreground mt-1 leading-relaxed">{video.description}</p>
						)}
						{video.hashtags.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-2">
								{video.hashtags.map(({ hashtag }) => (
									<Link key={hashtag.id} href={`/hashtags/${hashtag.name}`} className="text-primary text-xs hover:underline font-medium">
										#{hashtag.name}
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3 px-3 py-2 border-b shrink-0">
						<button
							onClick={handleLike}
							disabled={!currentUserId || isPending}
							className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
						>
							<Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
							{likeCount}
						</button>
						<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
							<MessageCircle className="h-4 w-4" />
							{comments.length}
						</div>
					</div>

					{/* Comments */}
					<ScrollArea className="flex-1 p-3">
						<div className="space-y-3">
							{comments.map((c) => {
								const cName = [c.user.firstName, c.user.lastName].filter(Boolean).join(" ") || c.user.userName;
								return (
									<div key={c.id} className="flex gap-2">
										<Avatar className="h-7 w-7 shrink-0">
											<AvatarImage src={c.user.avatar?.photoSrc ?? undefined} />
											<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
												{cName[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0 bg-muted rounded-xl px-3 py-2">
											<p className="font-semibold text-xs">{cName}</p>
											<p className="text-xs text-foreground/90 mt-0.5">{c.content}</p>
										</div>
									</div>
								);
							})}
							{comments.length === 0 && (
								<p className="text-xs text-muted-foreground text-center py-4">No comments yet</p>
							)}
						</div>
					</ScrollArea>

					{/* Comment input */}
					{currentUserId && (
						<div className="p-3 border-t shrink-0 flex gap-2">
							<Textarea
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder="Add a comment…"
								className="resize-none text-sm min-h-[36px] max-h-[80px] py-2"
								rows={1}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleComment();
									}
								}}
							/>
							<Button size="icon" className="h-9 w-9 shrink-0" onClick={handleComment} disabled={!commentText.trim() || isPending}>
								{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

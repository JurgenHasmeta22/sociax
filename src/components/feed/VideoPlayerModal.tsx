"use client";

import { useState, useRef, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogHeader,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Heart,
	MessageCircle,
	X,
	Send,
	Loader2,
	Hash,
	Trash2,
} from "lucide-react";
import {
	toggleVideoLike,
	addVideoComment,
	deleteVideo,
	getVideoLikes,
	toggleVideoCommentLike,
} from "@/actions/video.actions";
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
	_count?: { likes: number };
};

type VideoDetail = {
	id: number;
	title: string;
	description: string | null;
	url: string;
	thumbnailUrl: string | null;
	views: number;
	isLiked: boolean;
	likedCommentIds?: number[];
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

type LikeUser = {
	id: number;
	createdAt: Date;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
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

	// Likes modal state
	const [showLikesModal, setShowLikesModal] = useState(false);
	const [likeUsers, setLikeUsers] = useState<LikeUser[]>([]);
	const [loadingLikes, setLoadingLikes] = useState(false);

	// Comment likes state
	const [likedCommentIds, setLikedCommentIds] = useState<Set<number>>(
		new Set(video.likedCommentIds ?? []),
	);
	const [commentLikeCounts, setCommentLikeCounts] = useState<Record<number, number>>(
		Object.fromEntries(comments.map((c) => [c.id, c._count?.likes ?? 0])),
	);

	const authorName =
		[video.author.firstName, video.author.lastName]
			.filter(Boolean)
			.join(" ") || video.author.userName;

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
				setCommentLikeCounts((prev) => ({ ...prev, [newComment.id]: 0 }));
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

	async function handleShowLikes() {
		setShowLikesModal(true);
		setLoadingLikes(true);
		try {
			const likes = await getVideoLikes(video.id);
			setLikeUsers(likes);
		} catch {
			toast.error("Failed to load likes");
		} finally {
			setLoadingLikes(false);
		}
	}

	function handleCommentLike(commentId: number) {
		if (!currentUserId) return;
		const wasLiked = likedCommentIds.has(commentId);
		// Optimistic update
		setLikedCommentIds((prev) => {
			const next = new Set(prev);
			if (wasLiked) next.delete(commentId);
			else next.add(commentId);
			return next;
		});
		setCommentLikeCounts((prev) => ({
			...prev,
			[commentId]: (prev[commentId] ?? 0) + (wasLiked ? -1 : 1),
		}));

		startTransition(async () => {
			try {
				await toggleVideoCommentLike(commentId);
			} catch {
				// Revert on error
				setLikedCommentIds((prev) => {
					const next = new Set(prev);
					if (wasLiked) next.add(commentId);
					else next.delete(commentId);
					return next;
				});
				setCommentLikeCounts((prev) => ({
					...prev,
					[commentId]: (prev[commentId] ?? 0) + (wasLiked ? 1 : -1),
				}));
			}
		});
	}

	return (
		<>
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row h-[90vh]">
				<DialogTitle className="sr-only">{video.title}</DialogTitle>
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
							<Link
								href={`/profile/${video.author.userName}`}
								className="shrink-0"
							>
								<Avatar className="h-8 w-8">
									<AvatarImage
										src={
											video.author.avatar?.photoSrc ??
											undefined
										}
									/>
									<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
										{authorName[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</Link>
							<div className="min-w-0">
								<Link
									href={`/profile/${video.author.userName}`}
									className="font-semibold text-sm hover:underline line-clamp-1"
								>
									{authorName}
								</Link>
								<p className="text-xs text-muted-foreground">
									{formatDistanceToNow(
										new Date(video.createdAt),
										{ addSuffix: true },
									)}
								</p>
							</div>
						</div>
						{currentUserId === video.author.id && (
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 text-destructive hover:text-destructive"
								onClick={handleDelete}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						)}
					</div>

					{/* Info */}
					<div className="p-3 border-b shrink-0">
						<h2 className="font-semibold text-sm leading-snug">
							{video.title}
						</h2>
						{video.description && (
							<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
								{video.description}
							</p>
						)}
						{video.hashtags.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-2">
								{video.hashtags.map(({ hashtag }) => (
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
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3 px-3 py-2 border-b shrink-0">
						<button
							onClick={handleLike}
							disabled={!currentUserId || isPending}
							className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
						>
							<Heart
								className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
							/>
							<button
								type="button"
								className="hover:underline"
								onClick={(e) => {
									e.stopPropagation();
									handleShowLikes();
								}}
							>
								{likeCount}
							</button>
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
								const cName =
									[c.user.firstName, c.user.lastName]
										.filter(Boolean)
										.join(" ") || c.user.userName;
								const cLiked = likedCommentIds.has(c.id);
								const cLikeCount = commentLikeCounts[c.id] ?? 0;
								return (
									<div key={c.id} className="flex gap-2">
										<Avatar className="h-7 w-7 shrink-0">
											<AvatarImage
												src={
													c.user.avatar?.photoSrc ??
													undefined
												}
											/>
											<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
												{cName[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<div className="bg-muted rounded-xl px-3 py-2">
												<p className="font-semibold text-xs">
													{cName}
												</p>
												<p className="text-xs text-foreground/90 mt-0.5">
													{c.content}
												</p>
											</div>
											<div className="flex items-center gap-3 mt-0.5 ml-2">
												<span className="text-[10px] text-muted-foreground">
													{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
												</span>
												{currentUserId && (
													<button
														onClick={() => handleCommentLike(c.id)}
														className={`flex items-center gap-0.5 text-[10px] font-medium transition-colors ${
															cLiked
																? "text-red-500"
																: "text-muted-foreground hover:text-red-500"
														}`}
													>
														<Heart
															className={`h-3 w-3 ${cLiked ? "fill-red-500" : ""}`}
														/>
														{cLikeCount > 0 && cLikeCount}
													</button>
												)}
												{!currentUserId && cLikeCount > 0 && (
													<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
														<Heart className="h-3 w-3" />
														{cLikeCount}
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})}
							{comments.length === 0 && (
								<p className="text-xs text-muted-foreground text-center py-4">
									No comments yet
								</p>
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
							<Button
								size="icon"
								className="h-9 w-9 shrink-0"
								onClick={handleComment}
								disabled={!commentText.trim() || isPending}
							>
								{isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Send className="h-4 w-4" />
								)}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>

		{/* Likes modal */}
		<Dialog open={showLikesModal} onOpenChange={(o) => !o && setShowLikesModal(false)}>
			<DialogContent className="sm:max-w-sm p-0 gap-0">
				<DialogHeader className="p-4 pb-2">
					<DialogTitle className="text-base font-semibold">Likes</DialogTitle>
				</DialogHeader>
				<ScrollArea className="max-h-[400px]">
					{loadingLikes ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : likeUsers.length === 0 ? (
						<p className="text-center text-sm text-muted-foreground py-8">No likes yet</p>
					) : (
						<div className="p-2">
							{likeUsers.map((like) => {
								const lName =
									[like.user.firstName, like.user.lastName]
										.filter(Boolean)
										.join(" ") || like.user.userName;
								return (
									<Link
										key={like.id}
										href={`/profile/${like.user.userName}`}
										onClick={() => setShowLikesModal(false)}
										className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
									>
										<Avatar className="h-9 w-9">
											<AvatarImage
												src={like.user.avatar?.photoSrc ?? undefined}
											/>
											<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
												{lName[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<p className="font-semibold text-sm truncate">{lName}</p>
											<p className="text-xs text-muted-foreground truncate">@{like.user.userName}</p>
										</div>
									</Link>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
		</>
	);
}

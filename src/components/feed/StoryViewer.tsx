"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ChevronLeft,
	ChevronRight,
	X,
	Trash2,
	Eye,
	Loader2,
	Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
	deleteStory,
	markStoryViewed,
	toggleStoryReaction,
	addStoryComment,
	deleteStoryComment,
} from "@/actions/story.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ReactionType } from "../../../prisma/generated/prisma/enums";

type StoryUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

type StoryReaction = {
	id: number;
	reaction: ReactionType;
	userId: number;
	user: StoryUser;
};

type StoryComment = {
	id: number;
	content: string;
	createdAt: Date;
	userId: number;
	user: StoryUser;
};

export type StoryItem = {
	id: number;
	mediaUrl: string;
	caption: string | null;
	createdAt: Date;
	user: StoryUser;
	views: { id: number }[];
	reactions: StoryReaction[];
	comments: StoryComment[];
	_count: { views: number; reactions: number; comments: number };
};

const displayName = (u: StoryUser) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

const STORY_DURATION = 5000;

const EMOJI_REACTIONS: { type: ReactionType; emoji: string }[] = [
	{ type: "Like", emoji: "👍" },
	{ type: "Love", emoji: "❤️" },
	{ type: "Haha", emoji: "😂" },
	{ type: "Wow", emoji: "😮" },
	{ type: "Sad", emoji: "😢" },
	{ type: "Angry", emoji: "😡" },
];

function isVideo(url: string) {
	return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export function StoryViewer({
	stories,
	initialIndex,
	currentUserId,
	onClose,
}: {
	stories: StoryItem[];
	initialIndex: number;
	currentUserId: number;
	onClose: () => void;
}) {
	const [index, setIndex] = useState(initialIndex);
	const [progress, setProgress] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [commentText, setCommentText] = useState("");
	const [isSubmittingComment, setIsSubmittingComment] = useState(false);
	const [showComments, setShowComments] = useState(false);

	// Local mutable state for reactions/comments
	const [localStories, setLocalStories] = useState<StoryItem[]>(stories);
	const videoRef = useRef<HTMLVideoElement>(null);

	const story = localStories[index];
	const isOwn = story?.user.id === currentUserId;

	const myReaction =
		story?.reactions.find((r) => r.userId === currentUserId)?.reaction ??
		null;

	const goNext = useCallback(() => {
		if (index < localStories.length - 1) {
			setIndex((i) => i + 1);
			setProgress(0);
			setShowComments(false);
		} else {
			onClose();
		}
	}, [index, localStories.length, onClose]);

	const goPrev = () => {
		if (index > 0) {
			setIndex((i) => i - 1);
			setProgress(0);
			setShowComments(false);
		}
	};

	useEffect(() => {
		if (!story) return;
		markStoryViewed(story.id).catch(() => {});
	}, [story?.id]);

	// Progress timer — pauses when comments are open or user is typing
	useEffect(() => {
		if (isPaused || showComments) return;
		const storyIsVideo = isVideo(story?.mediaUrl ?? "");
		if (storyIsVideo) {
			// For video, sync progress with video element
			const vid = videoRef.current;
			if (!vid) return;
			const onTimeUpdate = () => {
				if (vid.duration)
					setProgress((vid.currentTime / vid.duration) * 100);
			};
			const onEnded = () => goNext();
			vid.addEventListener("timeupdate", onTimeUpdate);
			vid.addEventListener("ended", onEnded);
			return () => {
				vid.removeEventListener("timeupdate", onTimeUpdate);
				vid.removeEventListener("ended", onEnded);
			};
		}

		const start = Date.now();
		const interval = setInterval(() => {
			const elapsed = Date.now() - start;
			const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
			setProgress(pct);
			if (pct >= 100) {
				clearInterval(interval);
				goNext();
			}
		}, 50);
		return () => clearInterval(interval);
	}, [index, goNext, isPaused, showComments, story?.mediaUrl]);

	const handleDelete = () => {
		if (!story || !isOwn) return;
		startTransition(async () => {
			try {
				await deleteStory(story.id);
				toast.success("Story deleted.");
				if (localStories.length === 1) {
					onClose();
				} else {
					goNext();
				}
			} catch {
				toast.error("Failed to delete story.");
			}
		});
	};

	const handleReaction = (reactionType: ReactionType) => {
		if (!story) return;
		startTransition(async () => {
			try {
				const result = await toggleStoryReaction(
					story.id,
					reactionType,
				);
				setLocalStories((prev) =>
					prev.map((s, i) => {
						if (i !== index) return s;
						const withoutMe = s.reactions.filter(
							(r) => r.userId !== currentUserId,
						);
						if (result === null) {
							return {
								...s,
								reactions: withoutMe,
								_count: {
									...s._count,
									reactions: withoutMe.length,
								},
							};
						}
						const newReaction: StoryReaction = {
							id: Date.now(),
							reaction: result,
							userId: currentUserId,
							user: s.user, // approximate
						};
						return {
							...s,
							reactions: [...withoutMe, newReaction],
							_count: {
								...s._count,
								reactions: withoutMe.length + 1,
							},
						};
					}),
				);
			} catch {
				toast.error("Failed to react.");
			}
		});
	};

	const handleSubmitComment = async () => {
		if (!commentText.trim() || !story) return;
		setIsSubmittingComment(true);
		try {
			const comment = await addStoryComment(story.id, commentText.trim());
			setLocalStories((prev) =>
				prev.map((s, i) => {
					if (i !== index) return s;
					return {
						...s,
						comments: [...s.comments, comment as StoryComment],
						_count: {
							...s._count,
							comments: s._count.comments + 1,
						},
					};
				}),
			);
			setCommentText("");
		} catch {
			toast.error("Failed to add comment.");
		} finally {
			setIsSubmittingComment(false);
		}
	};

	const handleDeleteComment = (commentId: number) => {
		if (!story) return;
		startTransition(async () => {
			try {
				await deleteStoryComment(commentId);
				setLocalStories((prev) =>
					prev.map((s, i) => {
						if (i !== index) return s;
						const filtered = s.comments.filter(
							(c) => c.id !== commentId,
						);
						return {
							...s,
							comments: filtered,
							_count: { ...s._count, comments: filtered.length },
						};
					}),
				);
			} catch {
				toast.error("Failed to delete comment.");
			}
		});
	};

	// Group reactions by type for summary display
	const reactionSummary = story?.reactions.reduce(
		(acc, r) => {
			acc[r.reaction] = (acc[r.reaction] ?? 0) + 1;
			return acc;
		},
		{} as Record<ReactionType, number>,
	);

	if (!story) return null;

	const name = displayName(story.user);
	const storyIsVideo = isVideo(story.mediaUrl);

	return (
		<div
			className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
			onClick={(e) => {
				// Close comments panel when clicking outside
				if (showComments && e.target === e.currentTarget)
					setShowComments(false);
			}}
		>
			<button
				onClick={onClose}
				className="absolute top-4 right-4 z-10 text-white/80 hover:text-white"
			>
				<X className="h-7 w-7" />
			</button>

			<div className="relative w-full max-w-sm h-[calc(100vh-2rem)] max-h-[700px] rounded-xl overflow-hidden shadow-2xl">
				{/* Progress bars */}
				<div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
					{localStories.map((_, i) => (
						<div
							key={i}
							className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
						>
							<div
								className="h-full bg-white rounded-full transition-none"
								style={{
									width:
										i < index
											? "100%"
											: i === index
												? `${progress}%`
												: "0%",
								}}
							/>
						</div>
					))}
				</div>

				{/* Header */}
				<div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-3 py-2">
					<div className="flex items-center gap-2">
						<Avatar className="h-9 w-9 ring-2 ring-white">
							<AvatarImage
								src={story.user.avatar?.photoSrc ?? undefined}
							/>
							<AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
								{name[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<p className="text-white text-sm font-semibold drop-shadow leading-tight">
								{name}
							</p>
							<p className="text-white/60 text-xs">
								{formatDistanceToNow(
									new Date(story.createdAt),
									{ addSuffix: true },
								)}
							</p>
						</div>
					</div>
					{isOwn && (
						<div className="flex items-center gap-2">
							<span className="text-white/70 text-xs flex items-center gap-1">
								<Eye className="h-3.5 w-3.5" />
								{story._count.views}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-white/80 hover:text-red-400 hover:bg-white/10"
								onClick={handleDelete}
								disabled={isPending}
							>
								{isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Trash2 className="h-4 w-4" />
								)}
							</Button>
						</div>
					)}
				</div>

				{/* Media */}
				<div className="relative w-full h-full bg-black">
					{storyIsVideo ? (
						<video
							ref={videoRef}
							src={story.mediaUrl}
							className="w-full h-full object-cover"
							autoPlay
							playsInline
							muted={false}
							key={story.id}
						/>
					) : (
						<Image
							src={story.mediaUrl}
							alt={story.caption ?? "Story"}
							fill
							unoptimized
							className="object-cover"
							sizes="400px"
							priority
						/>
					)}

					{/* Caption */}
					{story.caption && !showComments && (
						<div className="absolute bottom-20 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-2">
							<p className="text-white text-sm font-medium text-center drop-shadow">
								{story.caption}
							</p>
						</div>
					)}
				</div>

				{/* Comments panel */}
				{showComments && (
					<div
						className="absolute bottom-16 left-0 right-0 z-20 bg-black/80 backdrop-blur max-h-64 flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
							<p className="text-white text-xs font-semibold">
								Comments ({story._count.comments})
							</p>
							<button
								onClick={() => setShowComments(false)}
								className="text-white/60 hover:text-white"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
							{story.comments.length === 0 ? (
								<p className="text-white/40 text-xs text-center py-4">
									No comments yet
								</p>
							) : (
								story.comments.map((comment) => (
									<div
										key={comment.id}
										className="flex items-start gap-2"
									>
										<Avatar className="h-6 w-6 shrink-0">
											<AvatarImage
												src={
													comment.user.avatar
														?.photoSrc ?? undefined
												}
											/>
											<AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
												{displayName(
													comment.user,
												)[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<span className="text-white text-xs font-semibold mr-1">
												{displayName(comment.user)}
											</span>
											<span className="text-white/80 text-xs">
												{comment.content}
											</span>
										</div>
										{comment.userId === currentUserId && (
											<button
												onClick={() =>
													handleDeleteComment(
														comment.id,
													)
												}
												className="text-white/40 hover:text-red-400 shrink-0"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
								))
							)}
						</div>
					</div>
				)}

				{/* Bottom bar: reactions + comment input */}
				<div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
					{/* Reaction summary */}
					{reactionSummary &&
						Object.keys(reactionSummary).length > 0 && (
							<div className="flex gap-1.5 mb-2">
								{EMOJI_REACTIONS.filter(
									(r) => (reactionSummary[r.type] ?? 0) > 0,
								).map((r) => (
									<span
										key={r.type}
										className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-white flex items-center gap-1"
									>
										{r.emoji}
										<span className="text-xs">
											{reactionSummary[r.type]}
										</span>
									</span>
								))}
							</div>
						)}

					{/* Emoji reaction row */}
					<div className="flex gap-1 mb-2">
						{EMOJI_REACTIONS.map((r) => (
							<button
								key={r.type}
								onClick={() => handleReaction(r.type)}
								className={cn(
									"text-xl rounded-full w-9 h-9 flex items-center justify-center transition-all hover:scale-125",
									myReaction === r.type
										? "bg-white/20 ring-2 ring-white/60 scale-110"
										: "hover:bg-white/10",
								)}
							>
								{r.emoji}
							</button>
						))}
					</div>

					{/* Comment input */}
					<div
						className="flex gap-2 items-center"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => {
								setShowComments((v) => !v);
								setIsPaused((v) => !v);
							}}
							className="text-white/70 text-xs hover:text-white transition-colors shrink-0"
						>
							💬 {story._count.comments}
						</button>
						<Input
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSubmitComment();
								}
							}}
							onFocus={() => setIsPaused(true)}
							onBlur={() => setIsPaused(false)}
							placeholder="Add a comment…"
							className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full flex-1"
						/>
						<button
							onClick={handleSubmitComment}
							disabled={
								!commentText.trim() || isSubmittingComment
							}
							className="text-white/70 hover:text-white disabled:opacity-40 shrink-0"
						>
							{isSubmittingComment ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>

				{/* Nav overlays */}
				{index > 0 && (
					<button
						onClick={goPrev}
						className={cn(
							"absolute left-0 top-0 bottom-16 w-1/3 flex items-center justify-start pl-2",
							"text-white/0 hover:text-white/80 transition-colors",
						)}
					>
						<ChevronLeft className="h-8 w-8" />
					</button>
				)}
				<button
					onClick={goNext}
					className={cn(
						"absolute right-0 top-0 bottom-16 w-1/3 flex items-center justify-end pr-2",
						"text-white/0 hover:text-white/80 transition-colors",
					)}
				>
					<ChevronRight className="h-8 w-8" />
				</button>
			</div>
		</div>
	);
}

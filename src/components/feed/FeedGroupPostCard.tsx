"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	MessageCircle,
	Send,
	Heart,
	Trash2,
	Users,
	ImagePlus,
	X,
	Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	toggleGroupPostLike,
	createGroupPostComment,
	deleteGroupPostComment,
	getGroupPostComments,
	getGroupPostReactions,
	toggleGroupPostCommentLike,
} from "@/actions/group.actions";
import type { ReactionType } from "../../../prisma/generated/prisma/enums";

const REACTIONS: Record<string, { emoji: string; label: string }> = {
	Like: { emoji: "👍", label: "Like" },
	Love: { emoji: "❤️", label: "Love" },
	Haha: { emoji: "😂", label: "Haha" },
	Wow: { emoji: "😮", label: "Wow" },
	Sad: { emoji: "😢", label: "Sad" },
	Angry: { emoji: "😠", label: "Angry" },
};

type GroupComment = {
	id: number;
	content: string;
	mediaUrl?: string | null;
	createdAt: Date;
	likeCount?: number;
	isLikedByMe?: boolean;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};

type ReactionUser = {
	id: number;
	reactionType: string;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};

function ReactionsModal({
	postId,
	open,
	onClose,
}: {
	postId: number;
	open: boolean;
	onClose: () => void;
}) {
	const [reactions, setReactions] = useState<ReactionUser[]>([]);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (open && !loaded) {
			getGroupPostReactions(postId).then((r) => {
				setReactions(r as ReactionUser[]);
				setLoaded(true);
			});
		}
	}, [open, loaded, postId]);

	if (!open) return null;

	const tabs = ["All", ...Object.keys(REACTIONS)];
	const grouped = Object.fromEntries(
		Object.keys(REACTIONS).map((key) => [
			key,
			reactions.filter((r) => r.reactionType === key),
		]),
	);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Reactions</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue="All">
					<TabsList className="flex-wrap h-auto gap-1 mb-2">
						{tabs.map((tab) => {
							const count =
								tab === "All"
									? reactions.length
									: (grouped[tab]?.length ?? 0);
							if (tab !== "All" && count === 0) return null;
							return (
								<TabsTrigger key={tab} value={tab} className="text-xs px-2 py-1">
									{tab === "All" ? `All ${count}` : `${REACTIONS[tab].emoji} ${count}`}
								</TabsTrigger>
							);
						})}
					</TabsList>
					{tabs.map((tab) => (
						<TabsContent key={tab} value={tab} className="max-h-72 overflow-y-auto space-y-2">
							{(tab === "All" ? reactions : (grouped[tab] ?? [])).map((r) => (
								<div key={r.id} className="flex items-center gap-3">
									<div className="relative">
										<Avatar className="h-9 w-9">
											<AvatarImage src={r.user.avatar?.photoSrc ?? undefined} />
											<AvatarFallback className="bg-primary text-primary-foreground text-xs">
												{((r.user.firstName || r.user.userName)[0] ?? "?").toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
											{REACTIONS[r.reactionType]?.emoji}
										</span>
									</div>
									<Link
										href={`/profile/${r.user.userName}`}
										className="text-sm font-medium hover:underline"
										onClick={() => onClose()}
									>
										{[r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || r.user.userName}
									</Link>
								</div>
							))}
						</TabsContent>
					))}
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

export type FeedGroupPost = {
	id: number;
	content: string | null;
	mediaUrl: string | null;
	createdAt: Date;
	group: {
		id: number;
		name: string;
		slug: string;
		avatarUrl: string | null;
	};
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	likes: { id: number; userId: number; reactionType: string }[];
	_count: { comments: number };
};

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function FeedGroupPostCard({
	post,
	currentUserId,
}: {
	post: FeedGroupPost;
	currentUserId: number;
}) {
	const myExisting = post.likes.find((l) => l.userId === currentUserId);
	const [myReaction, setMyReaction] = useState<string | null>(
		myExisting?.reactionType ?? null,
	);
	const [likeCount, setLikeCount] = useState(post.likes.length);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<GroupComment[]>([]);
	const [commentText, setCommentText] = useState("");
	const [commentMedia, setCommentMedia] = useState<File | null>(null);
	const [commentMediaPreview, setCommentMediaPreview] = useState<
		string | null
	>(null);
	const [isUploadingComment, setIsUploadingComment] = useState(false);
	const commentFileRef = useRef<HTMLInputElement | null>(null);
	const [isPending, startTransition] = useTransition();
	const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [showReactionsModal, setShowReactionsModal] = useState(false);

	const name = displayName(post.user);

	const handleReact = (type: string) => {
		setShowPicker(false);
		const isSame = myReaction === type;
		const wasLiked = myReaction !== null;
		if (isSame) {
			setMyReaction(null);
			setLikeCount((p) => p - 1);
		} else {
			if (!wasLiked) setLikeCount((p) => p + 1);
			setMyReaction(type);
		}
		startTransition(() =>
			toggleGroupPostLike(post.id, type as ReactionType),
		);
	};

	const handleOpenComments = () => {
		setShowComments(true);
		if (comments.length === 0) {
			startTransition(async () => {
				const fetched = await getGroupPostComments(post.id, currentUserId);
				setComments(fetched);
			});
		}
	};

	const handleCommentLike = (commentId: number) => {
		setComments((prev) =>
			prev.map((c) =>
				c.id === commentId
					? {
							...c,
							likeCount: c.isLikedByMe
								? (c.likeCount ?? 1) - 1
								: (c.likeCount ?? 0) + 1,
							isLikedByMe: !c.isLikedByMe,
						}
					: c,
			),
		);
		startTransition(() => toggleGroupPostCommentLike(commentId));
	};

	const handleComment = async () => {
		const text = commentText.trim();
		if (!text && !commentMedia) return;

		let uploadedUrl: string | undefined;
		if (commentMedia) {
			setIsUploadingComment(true);
			try {
				const fd = new FormData();
				fd.append("file", commentMedia);
				const res = await fetch("/api/upload", {
					method: "POST",
					body: fd,
				});
				if (res.ok) {
					const { url } = await res.json();
					uploadedUrl = url;
				}
			} finally {
				setIsUploadingComment(false);
			}
		}

		setCommentText("");
		setCommentMedia(null);
		setCommentMediaPreview(null);
		const optimistic: GroupComment = {
			id: Date.now(),
			content: text,
			mediaUrl: commentMediaPreview,
			createdAt: new Date(),
			user: {
				id: currentUserId,
				userName: "",
				firstName: null,
				lastName: null,
				avatar: null,
			},
		};
		setComments((p) => [...p, optimistic]);
		startTransition(() =>
			createGroupPostComment(post.id, text, uploadedUrl),
		);
	};

	const handleDeleteComment = (commentId: number) => {
		setComments((p) => p.filter((c) => c.id !== commentId));
		startTransition(() => deleteGroupPostComment(commentId));
	};

	return (
		<Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
			<CardContent className="pt-4 pb-0">
				<div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
					<div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
						{post.group.avatarUrl ? (
							<img
								src={post.group.avatarUrl}
								alt=""
								className="w-full h-full object-cover"
							/>
						) : (
							<Users className="h-3 w-3 text-primary" />
						)}
					</div>
					<Link
						href={`/groups/${post.group.slug}`}
						className="font-semibold text-foreground hover:underline"
					>
						{post.group.name}
					</Link>
				</div>

				<div className="flex items-center gap-3 mb-3">
					<Link href={`/profile/${post.user.userName}`}>
						<Avatar className="h-9 w-9">
							<AvatarImage
								src={post.user.avatar?.photoSrc ?? undefined}
							/>
							<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
								{name[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>
					<div>
						<Link
							href={`/profile/${post.user.userName}`}
							className="font-semibold text-sm hover:underline"
						>
							{name}
						</Link>
						<p className="text-xs text-muted-foreground">
							{formatDistanceToNow(new Date(post.createdAt), {
								addSuffix: true,
							})}
						</p>
					</div>
				</div>

				{post.content && (
					<p className="text-sm leading-relaxed mb-3">
						{post.content}
					</p>
				)}

				{post.mediaUrl && (
					<div className="rounded-lg overflow-hidden bg-muted mb-3 max-h-72 flex items-center justify-center">
						<img
							src={post.mediaUrl}
							alt=""
							className="object-cover w-full"
						/>
					</div>
				)}
			</CardContent>

			<CardContent className="pt-2 pb-2">
				{likeCount > 0 && (
					<>
						<p className="text-sm text-muted-foreground mb-2">
							{likeCount} reaction{likeCount !== 1 ? "s" : ""}
						</p>
						<Separator className="mb-1" />
					</>
				)}
				<div className="flex items-center -mx-1 relative">
					<div
						className="flex-1 flex justify-center relative"
						onMouseEnter={() => {
							hoverTimer.current = setTimeout(
								() => setShowPicker(true),
								500,
							);
						}}
						onMouseLeave={() => {
							if (hoverTimer.current)
								clearTimeout(hoverTimer.current);
						}}
					>
						{showPicker && (
							<div
								className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-background border border-border rounded-full shadow-lg px-2 py-1.5"
								onMouseEnter={() => {
									if (hoverTimer.current)
										clearTimeout(hoverTimer.current);
									setShowPicker(true);
								}}
								onMouseLeave={() => setShowPicker(false)}
							>
								{Object.entries(REACTIONS).map(
									([type, { emoji, label }]) => (
										<button
											key={type}
											title={label}
											onClick={() => handleReact(type)}
											className="text-2xl leading-none hover:scale-125 transition-transform duration-150 px-0.5"
										>
											{emoji}
										</button>
									),
								)}
							</div>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								myReaction
									? handleReact(myReaction)
									: handleReact("Like")
							}
							disabled={isPending}
							className={cn(
								"w-full gap-2 rounded-lg font-semibold text-sm h-9",
								myReaction
									? "text-primary hover:text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{myReaction ? (
								<span className="text-lg leading-none">
									{REACTIONS[myReaction]?.emoji}
								</span>
							) : (
								<Heart className="h-[18px] w-[18px]" />
							)}
							{myReaction ? REACTIONS[myReaction]?.label : "Like"}
						</Button>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleOpenComments}
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

			{showComments && (
				<CardContent className="pt-0 pb-4 border-t border-border/50 mt-1">
					<div className="space-y-3 mt-3 max-h-80 overflow-y-auto">
						{comments.map((c) => (
							<div key={c.id} className="flex gap-2 group">
								<Avatar className="h-7 w-7 shrink-0">
									<AvatarImage
										src={
											c.user.avatar?.photoSrc ?? undefined
										}
									/>
									<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
										{(displayName(c.user) ||
											"?")[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="bg-muted rounded-2xl px-3 py-2 text-sm">
										<span className="font-semibold text-xs block">
											{displayName(c.user) || "You"}
										</span>
										{c.content}
										{c.mediaUrl && (
											<div className="mt-1.5">
												<img
													src={c.mediaUrl}
													alt="media"
													className="max-h-32 rounded-xl object-cover"
												/>
											</div>
										)}
									</div>
								</div>
								{c.user.id === currentUserId && (
									<button
										onClick={() =>
											handleDeleteComment(c.id)
										}
										className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								)}
							</div>
						))}
					</div>
					<div className="flex gap-2 mt-3">
						<div className="flex-1 flex flex-col gap-1.5 bg-muted rounded-2xl px-3 py-2">
							{commentMediaPreview && (
								<div className="relative inline-flex">
									<img
										src={commentMediaPreview}
										alt="preview"
										className="max-h-24 rounded-xl object-cover"
									/>
									<button
										onClick={() => {
											setCommentMedia(null);
											setCommentMediaPreview(null);
											if (commentFileRef.current)
												commentFileRef.current.value =
													"";
										}}
										className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5"
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							)}
							<div className="flex items-end gap-2">
								<Textarea
									value={commentText}
									onChange={(e) =>
										setCommentText(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											void handleComment();
										}
									}}
									placeholder="Write a comment…"
									className="min-h-0 h-8 resize-none text-sm border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 flex-1"
								/>
								<input
									ref={commentFileRef}
									type="file"
									accept="image/*,.gif"
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (!file) return;
										setCommentMedia(file);
										setCommentMediaPreview(
											URL.createObjectURL(file),
										);
									}}
								/>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
									onClick={() =>
										commentFileRef.current?.click()
									}
									disabled={isPending || isUploadingComment}
								>
									<ImagePlus className="h-4 w-4" />
								</Button>
								<Button
									size="icon"
									className="h-7 w-7 rounded-full shrink-0"
									onClick={() => void handleComment()}
									disabled={
										(!commentText.trim() &&
											!commentMedia) ||
										isPending ||
										isUploadingComment
									}
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			)}

		<ReactionsModal
			postId={post.id}
			open={showReactionsModal}
			onClose={() => setShowReactionsModal(false)}
		/>
	</Card>
	);
}

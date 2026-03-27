"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Flag, MessageCircle, Send, ThumbsUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	togglePagePostLike,
	createPagePostComment,
	deletePagePostComment,
	getPagePostComments,
} from "@/actions/page.actions";
import type { ReactionType } from "../../../prisma/generated/prisma/enums";

const REACTIONS: Record<string, { emoji: string; label: string }> = {
	Like: { emoji: "👍", label: "Like" },
	Love: { emoji: "❤️", label: "Love" },
	Haha: { emoji: "😂", label: "Haha" },
	Wow: { emoji: "😮", label: "Wow" },
	Sad: { emoji: "😢", label: "Sad" },
	Angry: { emoji: "😠", label: "Angry" },
};

type PageComment = {
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

export type FeedPagePost = {
	id: number;
	content: string | null;
	mediaUrl: string | null;
	createdAt: Date;
	page: { id: number; name: string; slug: string; avatarUrl: string | null };
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	likes: { userId: number; reactionType: string }[];
	_count: { comments: number };
};

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function FeedPagePostCard({
	post,
	currentUserId,
}: {
	post: FeedPagePost;
	currentUserId: number;
}) {
	const myExisting = post.likes.find((l) => l.userId === currentUserId);
	const [myReaction, setMyReaction] = useState<string | null>(
		myExisting?.reactionType ?? null,
	);
	const [likeCount, setLikeCount] = useState(post.likes.length);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<PageComment[]>([]);
	const [commentText, setCommentText] = useState("");
	const [isPending, startTransition] = useTransition();
	const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [showPicker, setShowPicker] = useState(false);

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
			togglePagePostLike(post.id, type as ReactionType),
		);
	};

	const handleOpenComments = () => {
		setShowComments(true);
		if (comments.length === 0) {
			startTransition(async () => {
				const fetched = await getPagePostComments(post.id);
				setComments(fetched);
			});
		}
	};

	const handleComment = () => {
		const text = commentText.trim();
		if (!text) return;
		setCommentText("");
		const optimistic: PageComment = {
			id: Date.now(),
			content: text,
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
		startTransition(() => createPagePostComment(post.id, text));
	};

	const handleDeleteComment = (commentId: number) => {
		setComments((p) => p.filter((c) => c.id !== commentId));
		startTransition(() => deletePagePostComment(commentId));
	};

	return (
		<Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
			<CardContent className="pt-4 pb-0">
				<div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
					<div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
						{post.page.avatarUrl ? (
							<img
								src={post.page.avatarUrl}
								alt=""
								className="w-full h-full object-cover"
							/>
						) : (
							<Flag className="h-3 w-3 text-primary" />
						)}
					</div>
					<Link
						href={`/pages/${post.page.slug}`}
						className="font-semibold text-foreground hover:underline"
					>
						{post.page.name}
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
								<ThumbsUp className="h-[18px] w-[18px]" />
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
											c.user.avatar?.photoSrc ??
											undefined
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
						<Textarea
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleComment();
								}
							}}
							placeholder="Write a comment…"
							className="min-h-0 h-9 resize-none text-sm rounded-full py-2 px-4"
						/>
						<Button
							size="icon"
							className="h-9 w-9 rounded-full shrink-0"
							onClick={handleComment}
							disabled={!commentText.trim() || isPending}
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			)}
		</Card>
	);
}

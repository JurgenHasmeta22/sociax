"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ThumbsUp,
	MessageCircle,
	Share2,
	MoreHorizontal,
	Globe,
	Users,
	Lock,
	Bookmark,
	BookmarkCheck,
	Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	togglePostLike,
	deletePost,
	getPostReactions,
	togglePostSave,
} from "@/actions/post.actions";
import type { ReactionType } from "../../../prisma/generated/prisma/enums";
import { CommentsSection } from "@/components/feed/CommentsSection";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

const REACTIONS: Record<string, { emoji: string; label: string }> = {
	Like: { emoji: "👍", label: "Like" },
	Love: { emoji: "❤️", label: "Love" },
	Haha: { emoji: "😂", label: "Haha" },
	Wow: { emoji: "😮", label: "Wow" },
	Sad: { emoji: "😢", label: "Sad" },
	Angry: { emoji: "😠", label: "Angry" },
};

type PostLike = { id: number; userId: number; reactionType: string };

type Post = {
	id: number;
	content: string | null;
	createdAt: Date;
	privacy: string;
	saves?: { id: number }[];
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	media: { id: number; url: string; type: string; order: number }[];
	likes: PostLike[];
	_count: { comments: number; shares: number };
	hashtags: { hashtag: { id: number; name: string } }[];
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

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

function ReactionsModal({
	postId,
	open,
	onClose,
}: {
	postId: number;
	open: boolean;
	onClose: () => void;
}) {
	const [data, setData] = useState<ReactionUser[] | null>(null);

	useEffect(() => {
		if (open && data === null) {
			getPostReactions(postId).then(setData);
		}
		if (!open) setData(null);
	}, [open, postId]);

	const grouped = (data ?? []).reduce<Record<string, ReactionUser[]>>(
		(acc, r) => {
			(acc[r.reactionType] ??= []).push(r);
			return acc;
		},
		{},
	);
	const tabs = ["All", ...Object.keys(grouped)];

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) onClose();
			}}
		>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Reactions</DialogTitle>
				</DialogHeader>
				{!data ? (
					<p className="text-sm text-muted-foreground py-4 text-center">
						Loading…
					</p>
				) : (
					<Tabs defaultValue="All">
						<TabsList className="w-full flex-wrap h-auto gap-1 mb-2">
							{tabs.map((tab) => (
								<TabsTrigger
									key={tab}
									value={tab}
									className="text-xs px-2 py-1"
								>
									{tab === "All"
										? `All ${data.length}`
										: `${REACTIONS[tab]?.emoji} ${grouped[tab]?.length}`}
								</TabsTrigger>
							))}
						</TabsList>
						<TabsContent value="All">
							<ReactionList items={data} />
						</TabsContent>
						{Object.entries(grouped).map(([type, items]) => (
							<TabsContent key={type} value={type}>
								<ReactionList items={items} />
							</TabsContent>
						))}
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ReactionList({ items }: { items: ReactionUser[] }) {
	return (
		<div className="space-y-3 max-h-72 overflow-y-auto pr-1">
			{items.map((r) => {
				const n = displayName(r.user);
				return (
					<div key={r.id} className="flex items-center gap-3">
						<div className="relative">
							<Avatar className="h-9 w-9">
								<AvatarImage
									src={r.user.avatar?.photoSrc ?? undefined}
								/>
								<AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
									{n[0]?.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
								{REACTIONS[r.reactionType]?.emoji}
							</span>
						</div>
						<div>
							<Link
								href={`/profile/${r.user.userName}`}
								className="text-sm font-semibold hover:underline"
							>
								{n}
							</Link>
							<p className="text-xs text-muted-foreground">
								@{r.user.userName}
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function ReactionPicker({ onReact }: { onReact: (type: string) => void }) {
	return (
		<div className="flex items-center gap-1 bg-background border border-border rounded-full shadow-lg px-2 py-1.5">
			{Object.entries(REACTIONS).map(([type, { emoji, label }]) => (
				<button
					key={type}
					title={label}
					onClick={() => onReact(type)}
					className="text-2xl leading-none hover:scale-125 transition-transform duration-150 px-0.5"
				>
					{emoji}
				</button>
			))}
		</div>
	);
}

export function PostCard({
	post,
	currentUserId,
}: {
	post: Post;
	currentUserId: number;
}) {
	const myExisting = post.likes.find((l) => l.userId === currentUserId);
	const [myReaction, setMyReaction] = useState<string | null>(
		myExisting?.reactionType ?? null,
	);
	const [likeCount, setLikeCount] = useState(post.likes.length);
	const [showComments, setShowComments] = useState(false);
	const [commentCount, setCommentCount] = useState(post._count.comments);
	const [showReactionsModal, setShowReactionsModal] = useState(false);
	const [showPicker, setShowPicker] = useState(false);
	const [deleted, setDeleted] = useState(false);
	const [saved, setSaved] = useState((post.saves?.length ?? 0) > 0);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isPending, startTransition] = useTransition();
	const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const name = displayName(post.user);
	const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
		addSuffix: true,
	});
	const isOwnPost = post.user.id === currentUserId;

	const PrivacyIcon =
		post.privacy === "Public"
			? Globe
			: post.privacy === "FriendsOnly"
				? Users
				: Lock;

	const reactionCounts: Record<string, number> = {};
	post.likes.forEach((l) => {
		reactionCounts[l.reactionType] =
			(reactionCounts[l.reactionType] || 0) + 1;
	});
	if (myReaction) {
		reactionCounts[myReaction] = reactionCounts[myReaction] ?? 0;
	}
	const topReactions = Object.entries(reactionCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([type]) => type);

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

		startTransition(() => togglePostLike(post.id, type as ReactionType));
	};

	const handleLikeClick = () => {
		if (myReaction) {
			handleReact(myReaction);
		} else {
			handleReact("Like");
		}
	};

	const handleMouseEnter = () => {
		hoverTimer.current = setTimeout(() => setShowPicker(true), 500);
	};

	const handleMouseLeave = () => {
		if (hoverTimer.current) clearTimeout(hoverTimer.current);
	};

	const handleDelete = () => {
		setDeleted(true);
		startTransition(() => deletePost(post.id));
	};

	if (deleted) return null;

	return (
		<Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
			<CardContent className="pt-4 pb-0">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<Link href={`/profile/${post.user.userName}`}>
							<Avatar className="h-10 w-10">
								<AvatarImage
									src={
										post.user.avatar?.photoSrc ?? undefined
									}
								/>
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
							<DropdownMenuItem
								onClick={() => {
									setSaved((p) => !p);
									startTransition(() => {
										togglePostSave(post.id);
									});
								}}
							>
								{saved ? (
									<BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
								) : (
									<Bookmark className="h-4 w-4 mr-2" />
								)}
								{saved ? "Unsave post" : "Save post"}
							</DropdownMenuItem>
							{isOwnPost && (
								<DropdownMenuItem
									onClick={() => setShowDeleteConfirm(true)}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete post
								</DropdownMenuItem>
							)}
							{!isOwnPost && (
								<DropdownMenuItem className="text-destructive focus:text-destructive">
									Report post
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{post.content && (
					<p className="mt-3 text-sm leading-relaxed">
						{post.content}
					</p>
				)}
				{post.hashtags.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-1.5">
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
						<div className="grid grid-cols-2 gap-0.5">
							{post.media.slice(0, 4).map((m, i) => (
								<div
									key={m.id}
									className="relative h-48 bg-muted"
								>
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
				{(likeCount > 0 ||
					commentCount > 0 ||
					post._count.shares > 0) && (
					<>
						<div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
							<div className="flex items-center gap-1.5">
								{topReactions.length > 0 && (
									<div className="flex -space-x-1">
										{topReactions.map((r) => (
											<span
												key={r}
												className="text-base leading-none"
											>
												{REACTIONS[r]?.emoji}
											</span>
										))}
									</div>
								)}
								{likeCount > 0 && (
									<button
										onClick={() =>
											setShowReactionsModal(true)
										}
										className="hover:underline"
									>
										{likeCount.toLocaleString()}
									</button>
								)}
							</div>
							<div className="flex items-center gap-3">
								{commentCount > 0 && (
									<button
										onClick={() => setShowComments(true)}
										className="hover:underline"
									>
										{commentCount} comment
										{commentCount !== 1 ? "s" : ""}
									</button>
								)}
								{post._count.shares > 0 && (
									<span>{post._count.shares} shares</span>
								)}
							</div>
						</div>
						<Separator className="mb-1" />
					</>
				)}

				<div className="flex items-center justify-between -mx-1 relative">
					<div
						className="flex-1 flex justify-center relative"
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
					>
						{showPicker && (
							<div
								className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20"
								onMouseEnter={() => {
									if (hoverTimer.current)
										clearTimeout(hoverTimer.current);
									setShowPicker(true);
								}}
								onMouseLeave={() => setShowPicker(false)}
							>
								<ReactionPicker onReact={handleReact} />
							</div>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleLikeClick}
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
						onClick={() => {
							setShowComments(true);
						}}
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
				<CommentsSection
					postId={post.id}
					currentUserId={currentUserId}
					initialCount={commentCount}
				/>
			)}

			<ReactionsModal
				postId={post.id}
				open={showReactionsModal}
				onClose={() => setShowReactionsModal(false)}
			/>
			<ConfirmDeleteDialog
				open={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
				title="Delete post?"
				description="This post will be permanently removed. This action cannot be undone."
				isPending={isPending}
			/>
		</Card>
	);
}

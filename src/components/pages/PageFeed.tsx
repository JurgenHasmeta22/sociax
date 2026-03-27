"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ThumbsUp,
	MessageCircle,
	MoreHorizontal,
	Trash2,
	Loader2,
	Send,
	ImagePlus,
	X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
	createPagePost,
	deletePagePost,
	togglePagePostLike,
	createPagePostComment,
	deletePagePostComment,
	getPagePostComments,
	togglePagePostCommentLike,
	getPagePostReactions,
} from "@/actions/page.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import type { ReactionType } from "../../../prisma/generated/prisma/enums";

const REACTIONS: Record<string, { emoji: string; label: string }> = {
	Like: { emoji: "👍", label: "Like" },
	Love: { emoji: "❤️", label: "Love" },
	Haha: { emoji: "😂", label: "Haha" },
	Wow: { emoji: "😮", label: "Wow" },
	Sad: { emoji: "😢", label: "Sad" },
	Angry: { emoji: "😠", label: "Angry" },
};

type PagePostUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

type PageComment = {
	id: number;
	content: string;
	createdAt: Date;
	user: PagePostUser;
	likeCount: number;
	isLikedByMe: boolean;
	isPending?: boolean;
};

type PagePostItem = {
	id: number;
	content: string | null;
	mediaUrl: string | null;
	createdAt: Date;
	user: PagePostUser;
	likes: { userId: number; reactionType: string }[];
	_count: { likes: number; comments: number };
};

const displayName = (u: PagePostUser) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

type ReactionUser = {
	id: number;
	reactionType: string;
	user: PagePostUser;
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
	const [data, setData] = useState<ReactionUser[] | null>(null);

	useEffect(() => {
		if (open && data === null) {
			getPagePostReactions(postId).then(setData);
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
		<Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Reactions</DialogTitle>
				</DialogHeader>
				{!data ? (
					<p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
				) : (
					<Tabs defaultValue="All">
						<TabsList className="w-full flex-wrap h-auto gap-1 mb-2">
							{tabs.map((tab) => (
								<TabsTrigger key={tab} value={tab} className="text-xs px-2 py-1">
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
								<AvatarImage src={r.user.avatar?.photoSrc ?? undefined} />
								<AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
									{n[0]?.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
								{REACTIONS[r.reactionType]?.emoji}
							</span>
						</div>
						<div>
							<Link href={`/profile/${r.user.userName}`} className="text-sm font-semibold hover:underline">
								{n}
							</Link>
							<p className="text-xs text-muted-foreground">@{r.user.userName}</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function PagePostCard({
	post,
	currentUserId,
	pageSlug,
	isOwner,
}: {
	post: PagePostItem;
	currentUserId: number;
	pageSlug: string;
	isOwner: boolean;
}) {
	const myExisting = post.likes.find((l) => l.userId === currentUserId);
	const [myReaction, setMyReaction] = useState<string | null>(
		myExisting?.reactionType ?? null,
	);
	const [likeCount, setLikeCount] = useState(post._count.likes);
	const [deleted, setDeleted] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isPending, startTransition] = useTransition();
	const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<PageComment[]>([]);
	const [commentText, setCommentText] = useState("");
	const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
	const [showReactionsModal, setShowReactionsModal] = useState(false);

	if (deleted) return null;

	const name = displayName(post.user);

	const handleReact = (type: string) => {
		setShowPicker(false);
		const isSame = myReaction === type;
		const wasLiked = myReaction !== null;
		if (isSame) {
			setMyReaction(null);
			setLikeCount((c) => c - 1);
		} else {
			if (!wasLiked) setLikeCount((c) => c + 1);
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
				const fetched = await getPagePostComments(post.id, currentUserId);
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
			likeCount: 0,
			isLikedByMe: false,
			isPending: true,
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

	const handleCommentLike = (commentId: number) => {
		setComments((prev) =>
			prev.map((c) =>
				c.id === commentId
					? {
							...c,
							isLikedByMe: !c.isLikedByMe,
							likeCount: c.isLikedByMe ? c.likeCount - 1 : c.likeCount + 1,
						}
					: c,
			),
		);
		startTransition(() => togglePagePostCommentLike(commentId));
	};

	const handleDeleteComment = (commentId: number) => {
		setComments((p) => p.filter((c) => c.id !== commentId));
		startTransition(() => deletePagePostComment(commentId));
	};

	const handleDelete = () => {
		startTransition(async () => {
			try {
				await deletePagePost(post.id, pageSlug);
				setDeleted(true);
				toast.success("Post deleted.");
			} catch {
				toast.error("Failed to delete post.");
			}
		});
	};

	return (
		<>
			<Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
				<CardContent className="pt-4 pb-0">
					<div className="flex items-start justify-between mb-3">
						<div className="flex items-center gap-2.5">
							<Link href={`/profile/${post.user.userName}`}>
								<Avatar className="h-10 w-10 shrink-0">
									<AvatarImage
										src={
											post.user.avatar?.photoSrc ??
											undefined
										}
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
									{formatDistanceToNow(
										new Date(post.createdAt),
										{ addSuffix: true },
									)}
								</p>
							</div>
						</div>
						{(isOwner || post.user.id === currentUserId) && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() =>
											setShowDeleteConfirm(true)
										}
										className="text-destructive focus:text-destructive gap-2"
										disabled={isPending}
									>
										<Trash2 className="h-4 w-4" />
										Delete post
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					{post.content && (
						<p className="text-sm leading-relaxed mb-3">
							{post.content}
						</p>
					)}

					{post.mediaUrl && (
						<div className="relative rounded-lg overflow-hidden bg-muted mb-3 h-72">
							<Image
								src={post.mediaUrl}
								alt=""
								fill
								className="object-cover"
								sizes="600px"
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
												onClick={() =>
													handleReact(type)
												}
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
								{myReaction
									? REACTIONS[myReaction]?.label
									: "Like"}
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
										<div className="flex items-center gap-3 px-1 mt-1">
											<button
												onClick={() => handleCommentLike(c.id)}
												className={cn(
													"text-xs font-semibold hover:underline",
													c.isLikedByMe ? "text-primary" : "text-muted-foreground",
												)}
											>
												Like
											</button>
											{c.likeCount > 0 && (
												<span className="text-xs text-muted-foreground">
													{c.likeCount}
												</span>
											)}
										</div>
									</div>
									{c.user.id === currentUserId && (
										<button
											onClick={() =>
												setCommentToDelete(c.id)
											}
											className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity self-start mt-2"
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

			<ConfirmDeleteDialog
				open={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
				title="Delete post?"
				description="This post will be permanently removed from the page."
				isPending={isPending}
			/>
			<ConfirmDeleteDialog
				open={commentToDelete !== null}
				onClose={() => setCommentToDelete(null)}
				onConfirm={() => {
					if (commentToDelete !== null)
						handleDeleteComment(commentToDelete);
					setCommentToDelete(null);
				}}
				title="Delete comment?"
				description="This comment will be permanently removed."
				isPending={isPending}
			/>
			<ReactionsModal
				postId={post.id}
				open={showReactionsModal}
				onClose={() => setShowReactionsModal(false)}
			/>
		</>
	);
}

export function PageFeed({
	posts,
	pageId,
	pageSlug,
	currentUser,
	isOwner,
}: {
	posts: PagePostItem[];
	pageId: number;
	pageSlug: string;
	currentUser: {
		id: number;
		avatar: { photoSrc: string } | null;
		firstName: string | null;
		lastName: string | null;
		userName: string;
	};
	isOwner: boolean;
}) {
	const [content, setContent] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [localPosts, setLocalPosts] = useState<PagePostItem[]>(posts);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const clearFile = () => {
		setSelectedFile(null);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handlePost = () => {
		if (!content.trim() && !selectedFile) return;
		startTransition(async () => {
			try {
				let mediaUrl: string | undefined;
				if (selectedFile) {
					const fd = new FormData();
					fd.append("file", selectedFile);
					const res = await fetch("/api/upload", { method: "POST", body: fd });
					if (!res.ok) throw new Error("Upload failed");
					const json = await res.json();
					mediaUrl = json.url;
				}
				await createPagePost(pageId, content, mediaUrl);
				toast.success("Posted!");
				setContent("");
				clearFile();
			} catch {
				toast.error("Failed to post.");
			}
		});
	};

	const name = displayName(currentUser);

	return (
		<div className="space-y-4">
			{isOwner && (
				<Card className="shadow-sm">
					<CardContent className="pt-4 pb-3">
						<div className="flex items-start gap-3">
							<Avatar className="h-10 w-10 shrink-0 mt-0.5">
								<AvatarImage
									src={
										currentUser.avatar?.photoSrc ??
										undefined
									}
								/>
								<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
									{name[0]?.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-2">
								<Textarea
									placeholder="Write something for your page…"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									className="resize-none min-h-[80px] border-0 focus-visible:ring-0 p-0 text-sm"
								/>
								{previewUrl && selectedFile && (
									<div className="relative rounded-lg overflow-hidden bg-muted">
										{selectedFile.type.startsWith("video/") ? (
											<video
												src={previewUrl}
												className="w-full max-h-48 object-contain"
												controls
											/>
										) : (
											<img
												src={previewUrl}
												alt=""
												className="w-full max-h-48 object-contain"
											/>
										)}
										<button
											onClick={clearFile}
											className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background transition-colors"
										>
											<X className="h-4 w-4" />
										</button>
									</div>
								)}
								<div className="flex items-center justify-between border-t pt-2">
									<div className="flex items-center gap-1">
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*,video/*"
											className="hidden"
											onChange={handleFileChange}
										/>
										<button
											onClick={() => fileInputRef.current?.click()}
											className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded hover:bg-muted transition-colors"
											title="Add photo or video"
										>
											<ImagePlus className="h-4 w-4 text-green-500" />
											Photo/Video
										</button>
									</div>
									<Button
										size="sm"
										onClick={handlePost}
										disabled={isPending || (!content.trim() && !selectedFile)}
										className="gap-1.5"
									>
										{isPending ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<Send className="h-3.5 w-3.5" />
										)}
										Post
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{localPosts.length === 0 ? (
				<div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
					<p className="font-medium">No posts yet</p>
					{isOwner && (
						<p className="text-sm mt-1">
							Share something with your followers!
						</p>
					)}
				</div>
			) : (
				localPosts.map((post) => (
					<PagePostCard
						key={post.id}
						post={post}
						currentUserId={currentUser.id}
						pageSlug={pageSlug}
						isOwner={isOwner}
					/>
				))
			)}
		</div>
	);
}

"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
	Send,
	ImagePlus,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	createEventPost,
	deleteEventPost,
	toggleEventPostLike,
	createEventPostComment,
	deleteEventPostComment,
	getEventPostComments,
	toggleEventPostCommentLike,
	getEventPostReactions,
} from "@/actions/event.actions";
import type { ReactionType } from "../../../prisma/generated/prisma/enums";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "sonner";

const REACTIONS: Record<string, { emoji: string; label: string }> = {
	Like: { emoji: "👍", label: "Like" },
	Love: { emoji: "❤️", label: "Love" },
	Haha: { emoji: "😂", label: "Haha" },
	Wow: { emoji: "😮", label: "Wow" },
	Sad: { emoji: "😢", label: "Sad" },
	Angry: { emoji: "😠", label: "Angry" },
};

type EventPostLike = { id: number; userId: number; reactionType: string };
type EventPostComment = {
	id: number;
	content: string;
	mediaUrl?: string | null;
	createdAt: Date;
	likeCount: number;
	isLikedByMe: boolean;
	isPending?: boolean;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};
type EventPostData = {
	id: number;
	content: string | null;
	mediaUrl: string | null;
	createdAt: Date;
	myReaction: string | null;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	likes: EventPostLike[];
	_count: { comments: number };
};

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

type EventReactionUser = {
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

function EventReactionsModal({
	postId,
	open,
	onClose,
}: {
	postId: number;
	open: boolean;
	onClose: () => void;
}) {
	const [data, setData] = useState<EventReactionUser[] | null>(null);

	useEffect(() => {
		if (open && data === null) {
			getEventPostReactions(postId).then(setData);
		}
		if (!open) setData(null);
	}, [open, postId]);

	const grouped = (data ?? []).reduce<Record<string, EventReactionUser[]>>(
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
							<EventReactionList items={data} />
						</TabsContent>
						{Object.entries(grouped).map(([type, items]) => (
							<TabsContent key={type} value={type}>
								<EventReactionList items={items} />
							</TabsContent>
						))}
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
}

function EventReactionList({ items }: { items: EventReactionUser[] }) {
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

function EventPostCard({
	post,
	currentUserId,
	onDelete,
}: {
	post: EventPostData;
	currentUserId: number | null;
	onDelete: (id: number) => void;
}) {
	const [myReaction, setMyReaction] = useState<string | null>(
		post.myReaction,
	);
	const [likeCount, setLikeCount] = useState(post.likes.length);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<EventPostComment[]>([]);
	const [commentText, setCommentText] = useState("");
	const [commentMedia, setCommentMedia] = useState<File | null>(null);
	const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null);
	const [isUploadingComment, setIsUploadingComment] = useState(false);
	const commentMediaRef = useRef<HTMLInputElement>(null);
	const [isPending, startTransition] = useTransition();
	const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
	const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
	const [showReactionsModal, setShowReactionsModal] = useState(false);

	const reactionCounts: Record<string, number> = {};
	post.likes.forEach((l) => {
		reactionCounts[l.reactionType] = (reactionCounts[l.reactionType] || 0) + 1;
	});
	const topReactions = Object.entries(reactionCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([t]) => t);

	const name = displayName(post.user);
	const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
		addSuffix: true,
	});
	const isOwnPost = post.user.id === currentUserId;

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
			toggleEventPostLike(post.id, type as ReactionType),
		);
	};

	const handleOpenComments = () => {
		setShowComments(true);
		if (comments.length === 0) {
			startTransition(async () => {
				const fetched = await getEventPostComments(
					post.id,
					currentUserId ?? undefined,
				);
				setComments(fetched);
			});
		}
	};

	const handleComment = async () => {
		if (!currentUserId) return;
		const text = commentText.trim();
		if (!text && !commentMedia) return;

		let uploadedUrl: string | undefined;
		if (commentMedia) {
			setIsUploadingComment(true);
			try {
				const fd = new FormData();
				fd.append("file", commentMedia);
				const res = await fetch("/api/upload", { method: "POST", body: fd });
				if (res.ok) { const { url } = await res.json(); uploadedUrl = url; }
			} finally {
				setIsUploadingComment(false);
			}
		}

		setCommentText("");
		setCommentMedia(null);
		setCommentMediaPreview(null);
		const optimistic: EventPostComment = {
			id: Date.now(),
			content: text,
			mediaUrl: commentMediaPreview,
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
		startTransition(() => createEventPostComment(post.id, text, uploadedUrl));
	};

	const handleCommentLike = (commentId: number) => {
		setComments((prev) =>
			prev.map((c) =>
				c.id === commentId
					? {
							...c,
							isLikedByMe: !c.isLikedByMe,
							likeCount: c.isLikedByMe
								? c.likeCount - 1
								: c.likeCount + 1,
						}
					: c,
			),
		);
		startTransition(() => toggleEventPostCommentLike(commentId));
	};

	const handleDeleteComment = (commentId: number) => {
		setComments((p) => p.filter((c) => c.id !== commentId));
		startTransition(() => deleteEventPostComment(commentId));
	};

	const handleConfirmDeletePost = () => {
		onDelete(post.id);
		startTransition(() => deleteEventPost(post.id));
	};

	return (
		<>
			<Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
				<CardContent className="pt-4 pb-0">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<Link href={`/profile/${post.user.userName}`}>
								<Avatar className="h-10 w-10">
									<AvatarImage
										src={
											post.user.avatar?.photoSrc ??
											undefined
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
									className="font-semibold text-sm hover:underline"
								>
									{name}
								</Link>
								<p className="text-xs text-muted-foreground">
									{timeAgo}
								</p>
							</div>
						</div>
						{isOwnPost && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 rounded-full text-muted-foreground"
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() =>
											setShowDeletePostConfirm(true)
										}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Delete post
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>

					{post.content && (
						<p className="mt-3 text-sm leading-relaxed">
							{post.content}
						</p>
					)}
					{post.mediaUrl && (
						<div className="relative rounded-lg overflow-hidden bg-muted mt-3 h-72">
							<Image
								src={post.mediaUrl}
								alt=""
								fill
								unoptimized
								className="object-cover"
								sizes="600px"
							/>
						</div>
					)}
				</CardContent>

				<CardContent className="pt-3 pb-2">
					{likeCount > 0 && (
						<>
							<button
								onClick={() => setShowReactionsModal(true)}
								className="text-sm text-muted-foreground mb-2 hover:underline text-left w-full"
							>
								{likeCount} reaction{likeCount !== 1 ? "s" : ""}
							</button>
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
								disabled={isPending || !currentUserId}
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
								{!myReaction && "Like"}
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
											{c.content}										{c.mediaUrl && (
											<div className="mt-1.5">
												<img src={c.mediaUrl} alt="media" className="max-h-32 rounded-xl object-cover" />
											</div>
										)}										</div>
										<div className="flex items-center gap-3 px-1 mt-1">
											<button
												onClick={() =>
													handleCommentLike(c.id)
												}
												disabled={
													c.isPending ||
													!currentUserId
												}
												className={`text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-default ${c.isLikedByMe ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
											>
												Like
												{c.likeCount > 0
													? ` · ${c.likeCount}`
													: ""}
											</button>
										</div>
									</div>
									{c.user.id === currentUserId && (
										<button
											onClick={() =>
												setCommentToDelete(c.id)
											}
											className="opacity-0 group-hover:opacity-100 self-start mt-2 text-muted-foreground hover:text-destructive transition-opacity"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									)}
								</div>
							))}
						</div>
						<div className="flex gap-2 mt-3">
							{currentUserId && (
								<>
									<div className="flex-1 flex flex-col gap-1.5 bg-muted rounded-2xl px-3 py-2">
										{commentMediaPreview && (
											<div className="relative inline-flex">
												<img src={commentMediaPreview} alt="preview" className="max-h-24 rounded-xl object-cover" />
												<button
													onClick={() => { setCommentMedia(null); setCommentMediaPreview(null); if (commentMediaRef.current) commentMediaRef.current.value = ""; }}
													className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5"
												>
													<X className="h-3 w-3" />
												</button>
											</div>
										)}
										<div className="flex items-end gap-2">
											<Textarea
												value={commentText}
												onChange={(e) => setCommentText(e.target.value)}
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
												ref={commentMediaRef}
												type="file"
												accept="image/*,.gif"
												className="hidden"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (!file) return;
													setCommentMedia(file);
													setCommentMediaPreview(URL.createObjectURL(file));
												}}
											/>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
												onClick={() => commentMediaRef.current?.click()}
												disabled={isPending || isUploadingComment}
											>
												<ImagePlus className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												className="h-7 w-7 rounded-full shrink-0"
												onClick={() => void handleComment()}
												disabled={(!commentText.trim() && !commentMedia) || isPending || isUploadingComment}
											>
												<Send className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</>
							)}
						</div>
					</CardContent>
				)}
			</Card>

			<ConfirmDeleteDialog
				open={showDeletePostConfirm}
				onClose={() => setShowDeletePostConfirm(false)}
				onConfirm={handleConfirmDeletePost}
				title="Delete post?"
				description="This post will be permanently removed from the event."
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
			<EventReactionsModal
				postId={post.id}
				open={showReactionsModal}
				onClose={() => setShowReactionsModal(false)}
			/>
		</>
	);
}

function EventPostComposer({
	eventId,
	currentUser,
	onPost,
}: {
	eventId: number;
	currentUser: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	onPost: (post: EventPostData) => void;
}) {
	const [content, setContent] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
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

	const handleSubmit = () => {
		if (!content.trim() && !selectedFile) return;
		startTransition(async () => {
			try {
				let mediaUrl: string | undefined;
				if (selectedFile) {
					const fd = new FormData();
					fd.append("file", selectedFile);
					const res = await fetch("/api/upload", {
						method: "POST",
						body: fd,
					});
					if (!res.ok) throw new Error("Upload failed");
					const json = await res.json();
					mediaUrl = json.url;
				}
				const newPost = await createEventPost(
					eventId,
					content,
					mediaUrl,
				);
				if (newPost) onPost(newPost as unknown as EventPostData);
				setContent("");
				clearFile();
			} catch {
				toast.error("Failed to post.");
			}
		});
	};

	const name = displayName(currentUser);

	return (
		<Card className="shadow-sm">
			<CardContent className="pt-4 pb-4">
				<div className="flex items-start gap-3">
					<Avatar className="h-10 w-10 shrink-0 mt-0.5">
						<AvatarImage
							src={currentUser.avatar?.photoSrc ?? undefined}
						/>
						<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
							{name[0]?.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 space-y-2">
						<Textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Share an update about this event…"
							className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
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
									onClick={() =>
										fileInputRef.current?.click()
									}
									className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded hover:bg-muted transition-colors"
									title="Add photo or video"
								>
									<ImagePlus className="h-4 w-4 text-green-500" />
									Photo/Video
								</button>
							</div>
							<Button
								size="sm"
								disabled={
									(!content.trim() && !selectedFile) ||
									isPending
								}
								onClick={handleSubmit}
								className="font-semibold"
							>
								Post
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function EventFeed({
	posts: initialPosts,
	eventId,
	currentUserId,
	isOwner,
	currentUser,
}: {
	posts: EventPostData[];
	eventId: number;
	currentUserId: number | null;
	isOwner: boolean;
	currentUser: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	} | null;
}) {
	const [posts, setPosts] = useState<EventPostData[]>(initialPosts);

	const handleNewPost = (post: EventPostData) => {
		setPosts((p) => [post, ...p]);
	};

	const handleDeletePost = (id: number) => {
		setPosts((p) => p.filter((post) => post.id !== id));
	};

	return (
		<div className="space-y-4">
			{isOwner && currentUser && (
				<EventPostComposer
					eventId={eventId}
					currentUser={currentUser}
					onPost={handleNewPost}
				/>
			)}
			{posts.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
					<p className="font-medium">No updates yet</p>
					{isOwner && (
						<p className="text-sm mt-1">
							Share updates with attendees above.
						</p>
					)}
				</div>
			) : (
				posts.map((post) => (
					<EventPostCard
						key={post.id}
						post={post}
						currentUserId={currentUserId}
						onDelete={handleDeletePost}
					/>
				))
			)}
		</div>
	);
}

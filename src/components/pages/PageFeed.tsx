"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
	createPagePost,
	deletePagePost,
	togglePagePostLike,
} from "@/actions/page.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

type PagePostUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
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
	const [liked, setLiked] = useState(
		post.likes.some((l) => l.userId === currentUserId),
	);
	const [likeCount, setLikeCount] = useState(post._count.likes);
	const [deleted, setDeleted] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	if (deleted) return null;

	const name = displayName(post.user);

	const handleLike = () => {
		startTransition(async () => {
			const nowLiked = !liked;
			setLiked(nowLiked);
			setLikeCount((c) => (nowLiked ? c + 1 : c - 1));
			await togglePagePostLike(post.id);
		});
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
			<Card className="shadow-sm">
				<CardContent className="pt-4 pb-3">
					<div className="flex items-start justify-between mb-3">
						<div className="flex items-center gap-2.5">
							<Avatar className="h-10 w-10 shrink-0">
								<AvatarImage
									src={
										post.user.avatar?.photoSrc ?? undefined
									}
								/>
								<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
									{name[0]?.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-semibold text-sm leading-tight">
									{name}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatDistanceToNow(
										new Date(post.createdAt),
										{
											addSuffix: true,
										},
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

					<div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
						{likeCount > 0 && <span>{likeCount} likes</span>}
						{post._count.comments > 0 && (
							<>
								{likeCount > 0 && <span>·</span>}
								<span>{post._count.comments} comments</span>
							</>
						)}
					</div>

					<Separator className="mb-2" />

					<Button
						variant="ghost"
						size="sm"
						onClick={handleLike}
						disabled={isPending}
						className={cn(
							"gap-2 font-semibold h-9",
							liked && "text-primary",
						)}
					>
						<ThumbsUp
							className={cn("h-4 w-4", liked && "fill-current")}
						/>
						Like
					</Button>
				</CardContent>
			</Card>
			<ConfirmDeleteDialog
				open={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
				title="Delete post?"
				description="This post will be permanently removed from the page."
				isPending={isPending}
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
	const [mediaUrl, setMediaUrl] = useState("");
	const [isPending, startTransition] = useTransition();
	const [localPosts, setLocalPosts] = useState<PagePostItem[]>(posts);

	const handlePost = () => {
		if (!content.trim()) return;
		startTransition(async () => {
			try {
				await createPagePost(pageId, content, mediaUrl || undefined);
				toast.success("Posted!");
				setContent("");
				setMediaUrl("");
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
								<div className="flex items-center gap-2">
									<input
										type="text"
										placeholder="Image URL (optional)"
										value={mediaUrl}
										onChange={(e) =>
											setMediaUrl(e.target.value)
										}
										className="flex-1 text-xs text-muted-foreground bg-muted rounded px-2 py-1 border-0 focus:outline-none"
									/>
									<Button
										size="sm"
										onClick={handlePost}
										disabled={isPending || !content.trim()}
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

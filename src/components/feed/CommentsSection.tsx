"use client";

import { useState, useRef, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, Trash2, SendHorizonal, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	getComments,
	createComment,
	deleteComment,
	toggleCommentLike,
} from "@/actions/post.actions";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

type CommentUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

type Comment = {
	id: number;
	content: string;
	createdAt: Date;
	isDeleted: boolean;
	user: CommentUser;
	likes: { userId: number; reactionType: string }[];
};

const name = (u: CommentUser) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

function CommentItem({
	comment,
	currentUserId,
	onDelete,
}: {
	comment: Comment;
	currentUserId: number;
	onDelete: (id: number) => void;
}) {
	const [liked, setLiked] = useState(
		comment.likes.some((l) => l.userId === currentUserId),
	);
	const [likeCount, setLikeCount] = useState(comment.likes.length);
	const [isPending, startTransition] = useTransition();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleLike = () => {
		setLiked((p) => !p);
		setLikeCount((p) => (liked ? p - 1 : p + 1));
		startTransition(() => toggleCommentLike(comment.id));
	};

	const handleDelete = () => {
		onDelete(comment.id);
		startTransition(() => deleteComment(comment.id));
	};

	const displayName = name(comment.user);
	const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
		addSuffix: true,
	});

	return (
		<>
			<div className="flex gap-2.5 items-start group">
				<Link
					href={`/profile/${comment.user.userName}`}
					className="shrink-0"
				>
					<Avatar className="h-8 w-8">
						<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
							{displayName[0]?.toUpperCase()}
						</AvatarFallback>
						<AvatarImage
							src={comment.user.avatar?.photoSrc ?? undefined}
						/>
					</Avatar>
				</Link>
				<div className="flex-1 min-w-0">
					<div className="inline-block bg-muted rounded-2xl px-4 py-2 max-w-full">
						<Link
							href={`/profile/${comment.user.userName}`}
							className="font-semibold text-xs block hover:underline"
						>
							{displayName}
						</Link>
						<p className="text-sm leading-snug break-words">
							{comment.content}
						</p>
					</div>
					<div className="flex items-center gap-3 mt-1 ml-2 text-xs text-muted-foreground">
						<span>{timeAgo}</span>
						<button
							onClick={handleLike}
							disabled={isPending}
							className={cn(
								"font-semibold hover:text-foreground transition-colors",
								liked && "text-primary",
							)}
						>
							{liked ? "👍 Liked" : "Like"}
							{likeCount > 0 && (
								<span className="ml-1 font-normal">
									{likeCount}
								</span>
							)}
						</button>
						{comment.user.id === currentUserId && (
							<button
								onClick={() => setShowDeleteConfirm(true)}
								className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
							>
								<Trash2 className="h-3 w-3" />
							</button>
						)}
					</div>
				</div>
			</div>
			<ConfirmDeleteDialog
				open={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
				title="Delete comment?"
				description="This comment will be permanently removed."
				isPending={isPending}
			/>
		</>
	);
}

export function CommentsSection({
	postId,
	currentUserId,
	initialCount,
}: {
	postId: number;
	currentUserId: number;
	initialCount: number;
}) {
	const [comments, setComments] = useState<Comment[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [input, setInput] = useState("");
	const [isPending, startTransition] = useTransition();
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const loadComments = async () => {
		if (comments !== null) return;
		setLoading(true);
		try {
			const data = await getComments(postId);
			setComments(data);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = () => {
		const text = input.trim();
		if (!text) return;

		const optimistic: Comment = {
			id: Date.now(),
			content: text,
			createdAt: new Date(),
			isDeleted: false,
			user: {
				id: currentUserId,
				userName: "",
				firstName: "You",
				lastName: null,
				avatar: null,
			},
			likes: [],
		};

		setComments((prev) => [...(prev ?? []), optimistic]);
		setInput("");

		startTransition(async () => {
			await createComment(postId, text);
			const fresh = await getComments(postId);
			setComments(fresh);
		});
	};

	const handleDelete = (id: number) => {
		setComments((prev) => prev?.filter((c) => c.id !== id) ?? null);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="px-4 pb-3">
			<Separator className="mb-3" />

			{comments === null && initialCount > 0 && (
				<button
					onClick={loadComments}
					className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors"
				>
					<ChevronDown className="h-4 w-4" />
					View {initialCount} comment{initialCount !== 1 ? "s" : ""}
				</button>
			)}

			{loading && (
				<div className="space-y-3 mb-3">
					{Array.from({ length: Math.min(initialCount, 3) }).map(
						(_, i) => (
							<div key={i} className="flex gap-2.5">
								<Skeleton className="h-8 w-8 rounded-full shrink-0" />
								<Skeleton className="h-14 flex-1 rounded-2xl" />
							</div>
						),
					)}
				</div>
			)}

			{comments !== null && comments.length > 0 && (
				<div className="space-y-3 mb-3">
					{comments.map((c) => (
						<CommentItem
							key={c.id}
							comment={c}
							currentUserId={currentUserId}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			{comments !== null && comments.length === 0 && (
				<p className="text-xs text-muted-foreground mb-3">
					No comments yet. Be the first!
				</p>
			)}

			<div className="flex gap-2.5 items-end">
				<Avatar className="h-8 w-8 shrink-0">
					<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
						Y
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 flex items-end gap-2 bg-muted rounded-2xl px-3 py-1.5">
					<Textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						onFocus={loadComments}
						placeholder="Write a comment…"
						className="min-h-0 h-7 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm leading-snug"
						rows={1}
					/>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 shrink-0 text-primary hover:bg-transparent"
						onClick={handleSubmit}
						disabled={!input.trim() || isPending}
					>
						<SendHorizonal className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

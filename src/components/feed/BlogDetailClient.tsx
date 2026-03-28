"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toggleBlogLike, deleteBlog, getBlogLikers } from "@/actions/blog.actions";
import { toast } from "sonner";
import { Heart, PenLine, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";

type Liker = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

type BlogDetailProps = {
	blog: {
		id: number;
		slug: string;
		title: string;
		content: string;
		excerpt: string | null;
		coverImageUrl: string | null;
		published: boolean;
		createdAt: Date;
		updatedAt: Date;
		isLiked: boolean;
		isAuthor: boolean;
		author: {
			id: number;
			userName: string;
			firstName: string | null;
			lastName: string | null;
			avatar: { photoSrc: string } | null;
		};
		hashtags: { hashtag: { id: number; name: string } }[];
		_count: { likes: number };
	};
};

function renderContent(jsonContent: string): string {
	try {
		const json = JSON.parse(jsonContent) as object;
		return generateHTML(json, [
			StarterKit.configure({ heading: { levels: [2, 3] } }),
			TiptapImage,
			TiptapLink,
		]);
	} catch {
		return `<p>${jsonContent}</p>`;
	}
}

const displayName = (u: { firstName: string | null; lastName: string | null; userName: string }) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function BlogDetailClient({ blog }: BlogDetailProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isLiked, setIsLiked] = useState(blog.isLiked);
	const [likeCount, setLikeCount] = useState(blog._count.likes);
	const [likersOpen, setLikersOpen] = useState(false);
	const [likers, setLikers] = useState<Liker[] | null>(null);
	const [loadingLikers, setLoadingLikers] = useState(false);

	const authorName =
		[blog.author.firstName, blog.author.lastName]
			.filter(Boolean)
			.join(" ") || blog.author.userName;
	const htmlContent = renderContent(blog.content);

	function handleLike() {
		startTransition(async () => {
			const result = await toggleBlogLike(blog.id);
			setIsLiked(result.liked);
			setLikeCount((c) => c + (result.liked ? 1 : -1));
		});
	}

	async function handleShowLikers() {
		if (likeCount === 0) return;
		setLikersOpen(true);
		if (likers === null) {
			setLoadingLikers(true);
			try {
				const result = await getBlogLikers(blog.id);
				setLikers(result);
			} catch {
				toast.error("Failed to load likers");
			} finally {
				setLoadingLikers(false);
			}
		}
	}

	function handleDelete() {
		if (!confirm("Delete this blog post?")) return;
		startTransition(async () => {
			try {
				await deleteBlog(blog.id);
				toast.success("Blog deleted");
				router.push("/blog");
			} catch {
				toast.error("Failed to delete blog");
			}
		});
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-8">
			{/* Back */}
			<Button variant="ghost" size="sm" asChild className="gap-1.5 mb-6">
				<Link href="/blog">
					<ArrowLeft className="h-4 w-4" />
					All Posts
				</Link>
			</Button>

			{/* Cover image */}
			{blog.coverImageUrl && (
				<div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-muted mb-6">
					<Image
						src={blog.coverImageUrl}
						alt={blog.title}
						fill
						className="object-cover"
					/>
				</div>
			)}

			{/* Header */}
			<div className="mb-6">
				{!blog.published && (
					<Badge variant="outline" className="mb-3">
						Draft
					</Badge>
				)}
				<h1 className="text-3xl font-bold leading-tight mb-3">
					{blog.title}
				</h1>

				{/* Author + date */}
				<div className="flex items-center gap-3">
					<Link href={`/profile/${blog.author.userName}`}>
						<Avatar className="h-10 w-10">
							<AvatarImage
								src={blog.author.avatar?.photoSrc ?? undefined}
							/>
							<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
								{authorName[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>
					<div className="flex-1">
						<Link
							href={`/profile/${blog.author.userName}`}
							className="font-semibold text-sm hover:underline"
						>
							{authorName}
						</Link>
						<p className="text-xs text-muted-foreground">
							{formatDistanceToNow(new Date(blog.createdAt), {
								addSuffix: true,
							})}
						</p>
					</div>
					{/* Actions */}
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							<button
								onClick={handleLike}
								disabled={isPending}
								className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
							>
								<Heart
									className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
								/>
							</button>
							<button
								onClick={handleShowLikers}
								className={`text-sm font-medium transition-colors ${likeCount > 0 ? "hover:underline cursor-pointer text-muted-foreground hover:text-foreground" : "text-muted-foreground cursor-default"}`}
							>
								{likeCount}
							</button>
						</div>
						{blog.isAuthor && (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									asChild
								>
									<Link href={`/blog/${blog.slug}/edit`}>
										<PenLine className="h-4 w-4" />
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={handleDelete}
									disabled={isPending}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</>
						)}
					</div>
				</div>

				{/* Tags */}
				{blog.hashtags.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mt-3">
						{blog.hashtags.map(({ hashtag }) => (
							<Link
								key={hashtag.id}
								href={`/hashtags/${hashtag.name}`}
							>
								<Badge
									variant="secondary"
									className="text-xs font-normal hover:bg-primary/10"
								>
									#{hashtag.name}
								</Badge>
							</Link>
						))}
					</div>
				)}
			</div>

			{/* Divider */}
			<div className="border-t mb-6" />

			{/* Content */}
			<div
				className="prose prose-sm max-w-none dark:prose-invert"
				dangerouslySetInnerHTML={{ __html: htmlContent }}
			/>

			{/* Likers modal */}
			<Dialog open={likersOpen} onOpenChange={setLikersOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Heart className="h-4 w-4 fill-red-500 text-red-500" />
							Liked by ({likeCount})
						</DialogTitle>
					</DialogHeader>
					<ScrollArea className="max-h-80">
						{loadingLikers ? (
							<div className="flex justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : likers && likers.length === 0 ? (
							<p className="text-center text-sm text-muted-foreground py-8">
								No likes yet
							</p>
						) : (
							<div className="space-y-1 pr-3">
								{(likers ?? []).map((liker) => {
									const name = displayName(liker);
									return (
										<Link
											key={liker.id}
											href={`/profile/${liker.userName}`}
											onClick={() => setLikersOpen(false)}
											className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
										>
											<Avatar className="h-9 w-9 shrink-0">
												<AvatarImage
													src={
														liker.avatar?.photoSrc ??
														undefined
													}
												/>
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
													{name[0]?.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<p className="font-semibold text-sm truncate">
													{name}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													@{liker.userName}
												</p>
											</div>
										</Link>
									);
								})}
							</div>
						)}
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</div>
	);
}

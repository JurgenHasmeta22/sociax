"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleBlogLike, deleteBlog } from "@/actions/blog.actions";
import { toast } from "sonner";
import { Heart, PenLine, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";

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

export function BlogDetailClient({ blog }: BlogDetailProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isLiked, setIsLiked] = useState(blog.isLiked);
	const [likeCount, setLikeCount] = useState(blog._count.likes);

	const authorName = [blog.author.firstName, blog.author.lastName].filter(Boolean).join(" ") || blog.author.userName;
	const htmlContent = renderContent(blog.content);

	function handleLike() {
		startTransition(async () => {
			const result = await toggleBlogLike(blog.id);
			setIsLiked(result.liked);
			setLikeCount((c) => c + (result.liked ? 1 : -1));
		});
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
				<Link href="/blog"><ArrowLeft className="h-4 w-4" />All Posts</Link>
			</Button>

			{/* Cover image */}
			{blog.coverImageUrl && (
				<div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-muted mb-6">
					<Image src={blog.coverImageUrl} alt={blog.title} fill className="object-cover" />
				</div>
			)}

			{/* Header */}
			<div className="mb-6">
				{!blog.published && (
					<Badge variant="outline" className="mb-3">Draft</Badge>
				)}
				<h1 className="text-3xl font-bold leading-tight mb-3">{blog.title}</h1>

				{/* Author + date */}
				<div className="flex items-center gap-3">
					<Link href={`/profile/${blog.author.userName}`}>
						<Avatar className="h-10 w-10">
							<AvatarImage src={blog.author.avatar?.photoSrc ?? undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
								{authorName[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</Link>
					<div className="flex-1">
						<Link href={`/profile/${blog.author.userName}`} className="font-semibold text-sm hover:underline">
							{authorName}
						</Link>
						<p className="text-xs text-muted-foreground">
							{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
						</p>
					</div>
					{/* Actions */}
					<div className="flex items-center gap-2">
						<button
							onClick={handleLike}
							className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
						>
							<Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
							{likeCount}
						</button>
						{blog.isAuthor && (
							<>
								<Button variant="ghost" size="icon" className="h-8 w-8" asChild>
									<Link href={`/blog/${blog.slug}/edit`}><PenLine className="h-4 w-4" /></Link>
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
							<Link key={hashtag.id} href={`/hashtags/${hashtag.name}`}>
								<Badge variant="secondary" className="text-xs font-normal hover:bg-primary/10">
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
		</div>
	);
}

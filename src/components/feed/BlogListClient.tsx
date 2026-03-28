"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Loader2, PenLine } from "lucide-react";
import { getAllBlogs } from "@/actions/blog.actions";

type BlogItem = {
	id: number;
	title: string;
	slug: string;
	excerpt: string | null;
	coverImageUrl: string | null;
	createdAt: Date;
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

export function BlogListClient({
	initialBlogs,
	initialHasMore,
	isLoggedIn,
}: {
	initialBlogs: BlogItem[];
	initialHasMore: boolean;
	isLoggedIn: boolean;
}) {
	const [blogs, setBlogs] = useState<BlogItem[]>(initialBlogs);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [page, setPage] = useState(1);
	const [isPending, startTransition] = useTransition();

	function handleLoadMore() {
		const nextPage = page + 1;
		startTransition(async () => {
			const result = await getAllBlogs(nextPage);
			setBlogs((prev) => [...prev, ...(result.blogs as BlogItem[])]);
			setHasMore(result.hasMore);
			setPage(nextPage);
		});
	}

	if (blogs.length === 0) {
		return (
			<div className="text-center py-20 text-muted-foreground">
				<BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
				<p className="font-semibold text-lg">No blogs published yet</p>
				{isLoggedIn && (
					<Button asChild className="mt-4 gap-2">
						<Link href="/blog/new">
							<PenLine className="h-4 w-4" />
							Write the first one
						</Link>
					</Button>
				)}
			</div>
		);
	}

	return (
		<>
			<div className="space-y-6">
				{blogs.map((blog) => {
					const authorName =
						[blog.author.firstName, blog.author.lastName]
							.filter(Boolean)
							.join(" ") || blog.author.userName;
					return (
						<Card
							key={blog.id}
							className="overflow-hidden hover:shadow-md transition-shadow"
						>
							<Link href={`/blog/${blog.slug}`}>
								<div className="flex gap-0 flex-col sm:flex-row">
									{blog.coverImageUrl && (
										<div className="relative sm:w-48 w-full h-40 sm:h-auto shrink-0 bg-muted">
											<Image
												src={blog.coverImageUrl}
												alt={blog.title}
												fill
												className="object-cover"
											/>
										</div>
									)}
									<CardContent className="p-4 flex-1">
										<div className="flex items-center gap-2 mb-2">
											<Avatar className="h-6 w-6">
												<AvatarImage
													src={
														blog.author.avatar?.photoSrc ?? undefined
													}
												/>
												<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
													{authorName[0]?.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="text-xs text-muted-foreground font-medium">
												{authorName}
											</span>
											<span className="text-xs text-muted-foreground ml-auto">
												{formatDistanceToNow(new Date(blog.createdAt), {
													addSuffix: true,
												})}
											</span>
										</div>
										<h2 className="font-semibold text-base line-clamp-2 leading-snug">
											{blog.title}
										</h2>
										{blog.excerpt && (
											<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
												{blog.excerpt}
											</p>
										)}
										{blog.hashtags.length > 0 && (
											<div className="flex flex-wrap gap-1 mt-2">
												{blog.hashtags.slice(0, 4).map(({ hashtag }) => (
													<Badge
														key={hashtag.id}
														variant="secondary"
														className="text-xs font-normal"
													>
														#{hashtag.name}
													</Badge>
												))}
											</div>
										)}
										<div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
											<Heart className="h-3.5 w-3.5" />
											{blog._count.likes}
										</div>
									</CardContent>
								</div>
							</Link>
						</Card>
					);
				})}
			</div>
			{hasMore && (
				<div className="flex justify-center mt-8">
					<Button
						variant="outline"
						onClick={handleLoadMore}
						disabled={isPending}
						className="gap-2"
					>
						{isPending && <Loader2 className="h-4 w-4 animate-spin" />}
						Load more posts
					</Button>
				</div>
			)}
		</>
	);
}

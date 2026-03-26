"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flag, Plus, Search, Users, Loader2 } from "lucide-react";
import { fetchPages, followPage, unfollowPage } from "@/actions/page.actions";
import { CreatePageDialog } from "@/components/pages/CreatePageDialog";

type PageItem = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	avatarUrl: string | null;
	category: string;
	isFollowing: boolean;
	_count: { followers: number; posts: number };
};

function PageCard({
	page,
	onToggleFollow,
}: {
	page: PageItem;
	onToggleFollow: (id: number, following: boolean) => void;
}) {
	const [isPending, startTransition] = useTransition();

	const handleFollow = (e: React.MouseEvent) => {
		e.preventDefault();
		startTransition(async () => {
			if (page.isFollowing) {
				await unfollowPage(page.id);
			} else {
				await followPage(page.id);
			}
			onToggleFollow(page.id, !page.isFollowing);
		});
	};

	return (
		<Card className="overflow-hidden hover:shadow-md transition-shadow">
			<div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative">
				{page.avatarUrl && (
					<img
						src={page.avatarUrl}
						alt=""
						className="w-full h-full object-cover"
					/>
				)}
			</div>
			<CardContent className="pt-3 pb-4">
				<div className="flex items-start gap-3 mb-3">
					<div className="w-12 h-12 rounded-full bg-primary/10 border-4 border-background -mt-8 flex items-center justify-center shrink-0">
						<Flag className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<Link
							href={`/pages/${page.slug}`}
							className="font-semibold text-sm hover:underline truncate block leading-tight"
						>
							{page.name}
						</Link>
						<Badge variant="secondary" className="text-xs mt-0.5">
							{page.category}
						</Badge>
					</div>
				</div>
				{page.description && (
					<p className="text-xs text-muted-foreground line-clamp-2 mb-3">
						{page.description}
					</p>
				)}
				<div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Users className="h-3 w-3" />
						{page._count.followers.toLocaleString()} followers
					</span>
					<span>{page._count.posts} posts</span>
				</div>
				<Button
					size="sm"
					className="w-full"
					variant={page.isFollowing ? "secondary" : "default"}
					onClick={handleFollow}
					disabled={isPending}
				>
					{isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : page.isFollowing ? (
						"Following"
					) : (
						<>
							<Plus className="h-3.5 w-3.5 mr-1" />
							Follow
						</>
					)}
				</Button>
			</CardContent>
		</Card>
	);
}

const LIMIT = 20;

export function PagesClient({ initialPages }: { initialPages: PageItem[] }) {
	const [pages, setPages] = useState<PageItem[]>(initialPages);
	const [query, setQuery] = useState("");
	const [skip, setSkip] = useState(initialPages.length);
	const [hasMore, setHasMore] = useState(initialPages.length === LIMIT);
	const [createOpen, setCreateOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	useEffect(() => {
		const timer = setTimeout(async () => {
			setIsLoading(true);
			const result = await fetchPages(0, query);
			setPages(result.pages);
			setSkip(result.pages.length);
			setHasMore(result.hasMore);
			setIsLoading(false);
		}, 400);
		return () => clearTimeout(timer);
	}, [query]);

	const loadMore = async () => {
		setIsLoadingMore(true);
		const result = await fetchPages(skip, query);
		setPages((prev) => [...prev, ...result.pages]);
		setSkip((s) => s + result.pages.length);
		setHasMore(result.hasMore);
		setIsLoadingMore(false);
	};

	const handleToggleFollow = (id: number, nowFollowing: boolean) => {
		setPages((prev) =>
			prev.map((p) =>
				p.id === id
					? {
							...p,
							isFollowing: nowFollowing,
							_count: {
								...p._count,
								followers: nowFollowing
									? p._count.followers + 1
									: p._count.followers - 1,
							},
						}
					: p,
			),
		);
	};

	return (
		<>
			<div className="flex items-center gap-3 mb-6">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search pages…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
					<Plus className="h-4 w-4" />
					Create page
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : pages.length === 0 ? (
				<div className="text-center py-16 text-muted-foreground">
					<Flag className="h-12 w-12 mx-auto mb-4 opacity-20" />
					<p className="font-medium text-lg">No pages found</p>
					{query && (
						<p className="text-sm mt-1">
							Try a different search term
						</p>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{pages.map((page) => (
						<PageCard
							key={page.id}
							page={page}
							onToggleFollow={handleToggleFollow}
						/>
					))}
				</div>
			)}

			{hasMore && !isLoading && (
				<div className="text-center mt-8">
					<Button
						variant="secondary"
						onClick={loadMore}
						disabled={isLoadingMore}
					>
						{isLoadingMore ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Loading…
							</>
						) : (
							"Load more"
						)}
					</Button>
				</div>
			)}

			<CreatePageDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>
		</>
	);
}

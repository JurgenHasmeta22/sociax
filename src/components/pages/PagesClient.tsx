"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { formatCount } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Flag,
	Plus,
	Loader2,
	ChevronRight,
	ThumbsUp,
	Edit,
	Users,
} from "lucide-react";
import { fetchPages, followPage, unfollowPage } from "@/actions/page.actions";
import { CreatePageDialog } from "@/components/pages/CreatePageDialog";

type Tab = "suggestions" | "popular" | "mypages";

type PageItem = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	avatarUrl: string | null;
	coverUrl: string | null;
	category: string;
	isFollowing: boolean;
	_count: { followers: number; posts: number };
};

type OwnedPage = {
	id: number;
	name: string;
	slug: string;
	avatarUrl: string | null;
	updatedAt: Date | string;
};



function timeAgo(date: Date | string) {
	const now = new Date();
	const d = new Date(date);
	const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
	if (diff < 86400) return "today";
	const days = Math.floor(diff / 86400);
	if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
	const months = Math.floor(days / 30);
	return `${months} month${months > 1 ? "s" : ""} ago`;
}

// Featured carousel card (person-style)
function FeaturedPageCard({ page }: { page: PageItem }) {
	return (
		<Link
			href={`/pages/${page.slug}`}
			className="relative shrink-0 w-40 h-48 rounded-xl overflow-hidden block hover:opacity-90 transition-opacity"
		>
			{page.avatarUrl ? (
				<img
					src={page.avatarUrl}
					alt={page.name}
					className="w-full h-full object-cover"
				/>
			) : (
				<div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
					<Flag className="h-12 w-12 text-primary/40" />
				</div>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 p-3">
				<p className="text-white/70 text-xs">{page.category}</p>
				<p className="text-white font-semibold text-sm leading-tight truncate">
					{page.name}
				</p>
			</div>
		</Link>
	);
}

// Suggestion tab: 3-col grid card
function SuggestionPageCard({
	page,
	onToggle,
}: {
	page: PageItem;
	onToggle: (id: number, following: boolean) => void;
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
			onToggle(page.id, !page.isFollowing);
		});
	};

	return (
		<div className="rounded-xl overflow-hidden bg-card border border-border hover:shadow-md transition-shadow">
			<Link href={`/pages/${page.slug}`}>
				<div className="h-44 bg-muted relative">
					{page.avatarUrl ? (
						<img
							src={page.avatarUrl}
							alt={page.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
							<Flag className="h-10 w-10 text-primary/30" />
						</div>
					)}
				</div>
			</Link>
			<div className="p-4">
				<Link href={`/pages/${page.slug}`}>
					<h3 className="font-bold text-sm truncate hover:underline">
						{page.name}
					</h3>
				</Link>
				<p className="text-xs text-muted-foreground mt-0.5">
					{formatCount(page._count.followers)} followers
				</p>
				<Button
					size="sm"
					className="w-full mt-3"
					variant={page.isFollowing ? "secondary" : "default"}
					onClick={handleFollow}
					disabled={isPending}
				>
					{isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : page.isFollowing ? (
						"Following"
					) : (
						"Follow"
					)}
				</Button>
			</div>
		</div>
	);
}

// Popular tab: 2-col list item
function PopularPageRow({
	page,
	onToggle,
}: {
	page: PageItem;
	onToggle: (id: number, following: boolean) => void;
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
			onToggle(page.id, !page.isFollowing);
		});
	};

	return (
		<div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:shadow-sm transition-shadow">
			<Link href={`/pages/${page.slug}`}>
				<Avatar className="h-14 w-14 shrink-0 rounded-full">
					<AvatarImage src={page.avatarUrl ?? undefined} />
					<AvatarFallback className="bg-primary/10 text-primary font-semibold">
						{page.name[0]}
					</AvatarFallback>
				</Avatar>
			</Link>
			<div className="flex-1 min-w-0">
				<Link href={`/pages/${page.slug}`}>
					<p className="font-semibold text-sm truncate hover:underline">
						{page.name}
					</p>
				</Link>
				<p className="text-xs text-muted-foreground">
					{formatCount(page._count.followers)} followers
				</p>
			</div>
			<div className="flex gap-2 shrink-0">
				<Button
					size="sm"
					variant="secondary"
					className="gap-1.5"
					onClick={handleFollow}
					disabled={isPending}
				>
					{isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<>
							<ThumbsUp className="h-3.5 w-3.5" />
							{page.isFollowing ? "Liked" : "Like"}
						</>
					)}
				</Button>
				<Button size="sm" variant="secondary" className="gap-1.5">
					Message
				</Button>
			</div>
		</div>
	);
}

// My Pages tab: 3-col grid with Join/View buttons
function MyPageCard({
	page,
	onToggle,
}: {
	page: PageItem;
	onToggle: (id: number, following: boolean) => void;
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
			onToggle(page.id, !page.isFollowing);
		});
	};

	return (
		<div className="rounded-xl overflow-hidden bg-card border border-border hover:shadow-md transition-shadow">
			<Link href={`/pages/${page.slug}`}>
				<div className="relative h-32 bg-muted">
					{page.coverUrl ? (
						<img
							src={page.coverUrl}
							alt=""
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
					)}
					{page.avatarUrl && (
						<div className="absolute bottom-0 translate-y-1/2 left-4">
							<Avatar className="h-10 w-10 ring-2 ring-background">
								<AvatarImage src={page.avatarUrl} />
								<AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
									{page.name[0]}
								</AvatarFallback>
							</Avatar>
						</div>
					)}
				</div>
			</Link>
			<div
				className={page.avatarUrl ? "pt-7 px-4 pb-4" : "pt-4 px-4 pb-4"}
			>
				<Link href={`/pages/${page.slug}`}>
					<h3 className="font-bold text-sm truncate hover:underline">
						{page.name}
					</h3>
				</Link>
				<p className="text-xs text-muted-foreground mt-0.5">
					{formatCount(page._count.followers)} followers
				</p>
				<div className="mt-3">
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
							"Follow"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

// Right sidebar section
function SidebarSection({
	title,
	pages,
	buttonVariant,
	buttonLabel,
	onSeeAll,
	onButtonClick,
	followedIds,
}: {
	title: string;
	pages: OwnedPage[];
	buttonVariant: "default" | "secondary" | "outline";
	buttonLabel: string;
	onSeeAll?: () => void;
	onButtonClick?: (id: number) => void;
	followedIds?: Set<number>;
}) {
	return (
		<div className="bg-card border border-border rounded-xl p-4">
			<div className="flex items-center justify-between mb-3">
				<h3 className="font-bold text-sm">{title}</h3>
				{onSeeAll && (
					<button
						onClick={onSeeAll}
						className="text-xs text-primary hover:underline font-medium"
					>
						See all
					</button>
				)}
			</div>
			<div className="space-y-3">
				{pages.map((page) => {
					const isFollowed = followedIds?.has(page.id) ?? false;
					return (
						<div key={page.id} className="flex items-center gap-3">
							<Avatar className="h-9 w-9 shrink-0">
								<AvatarImage
									src={page.avatarUrl ?? undefined}
								/>
								<AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
									{page.name[0]}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<Link href={`/pages/${page.slug}`}>
									<p className="font-semibold text-xs truncate hover:underline">
										{page.name}
									</p>
								</Link>
								<p className="text-xs text-muted-foreground">
									Updated {timeAgo(page.updatedAt)}
								</p>
							</div>
							{onButtonClick ? (
								<Button
									size="sm"
									variant={
										isFollowed ? "secondary" : buttonVariant
									}
									className="shrink-0 h-7 px-3 text-xs"
									onClick={() => onButtonClick(page.id)}
								>
									{isFollowed ? "Liked" : buttonLabel}
								</Button>
							) : (
								<Button
									size="sm"
									variant={buttonVariant}
									className="shrink-0 h-7 px-3 text-xs"
									asChild
								>
									<Link href={`/pages/${page.slug}`}>
										{buttonLabel}
									</Link>
								</Button>
							)}
						</div>
					);
				})}
			</div>
			{pages.length > 0 && onSeeAll && (
				<Button
					variant="ghost"
					className="w-full mt-3 text-sm h-8"
					onClick={onSeeAll}
				>
					See all
				</Button>
			)}
		</div>
	);
}

const LIMIT = 20;

export function PagesClient({
	initialPages,
	ownedPages,
	suggestedPages,
}: {
	initialPages: PageItem[];
	ownedPages: OwnedPage[];
	suggestedPages: OwnedPage[];
}) {
	const [tab, setTab] = useState<Tab>("suggestions");
	const [pages, setPages] = useState<PageItem[]>(initialPages);
	const [query] = useState("");
	const [skip, setSkip] = useState(initialPages.length);
	const [hasMore, setHasMore] = useState(initialPages.length === LIMIT);
	const [createOpen, setCreateOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [sidebarFollowed, setSidebarFollowed] = useState<Set<number>>(
		() =>
			new Set(initialPages.filter((p) => p.isFollowing).map((p) => p.id)),
	);

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

	const handleSidebarLike = (pageId: number) => {
		const isNowFollowed = !sidebarFollowed.has(pageId);
		setSidebarFollowed((prev) => {
			const next = new Set(prev);
			if (isNowFollowed) next.add(pageId);
			else next.delete(pageId);
			return next;
		});
		if (isNowFollowed) followPage(pageId).catch(() => {});
		else unfollowPage(pageId).catch(() => {});
	};

	// Featured: top 4 pages
	const featured = pages.slice(0, 4);
	// Remaining
	const contentPages = pages.slice(4);
	// My followed pages
	const myFollowedPages = pages.filter((p) => p.isFollowing);

	const TABS: { key: Tab; label: string }[] = [
		{ key: "suggestions", label: "Suggestions" },
		{ key: "popular", label: "Popular" },
		{ key: "mypages", label: "My Pages" },
	];

	return (
		<>
			<div className="flex gap-6">
				{/* Main content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between mb-1">
						<h1 className="text-2xl font-bold">Pages</h1>
						<Button
							onClick={() => setCreateOpen(true)}
							className="gap-2 shrink-0"
						>
							<Plus className="h-4 w-4" />
							Create page
						</Button>
					</div>

					{/* Tabs */}
					<div className="flex gap-0 border-b border-border mb-6">
						{TABS.map(({ key, label }) => (
							<button
								key={key}
								onClick={() => setTab(key)}
								className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
									tab === key
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{label}
								{tab === key && (
									<span className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground rounded-t-full" />
								)}
							</button>
						))}
					</div>

					{/* Featured carousel */}
					{featured.length > 0 && (
						<div className="relative mb-8">
							<div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
								{featured.map((page) => (
									<FeaturedPageCard
										key={page.id}
										page={page}
									/>
								))}
							</div>
							<button className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors">
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					)}

					{isLoading ? (
						<div className="flex justify-center py-16">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<>
							{/* Tab content */}
							{tab === "suggestions" && (
								<>
									{contentPages.length === 0 && (
										<div className="text-center py-16 text-muted-foreground">
											<Flag className="h-12 w-12 mx-auto mb-4 opacity-20" />
											<p className="font-medium text-lg">
												No pages found
											</p>
										</div>
									)}
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
										{contentPages.map((page) => (
											<SuggestionPageCard
												key={page.id}
												page={page}
												onToggle={handleToggleFollow}
											/>
										))}
									</div>
								</>
							)}

							{tab === "popular" && (
								<>
									{pages.length === 0 && (
										<div className="text-center py-16 text-muted-foreground">
											<Flag className="h-12 w-12 mx-auto mb-4 opacity-20" />
											<p className="font-medium text-lg">
												No pages found
											</p>
										</div>
									)}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{pages.map((page) => (
											<PopularPageRow
												key={page.id}
												page={page}
												onToggle={handleToggleFollow}
											/>
										))}
									</div>
								</>
							)}

							{tab === "mypages" && (
								<>
									{myFollowedPages.length === 0 && (
										<div className="text-center py-16 text-muted-foreground">
											<Flag className="h-12 w-12 mx-auto mb-4 opacity-20" />
											<p className="font-medium text-lg">
												No pages yet
											</p>
											<p className="text-sm mt-1">
												Follow pages to see them here
											</p>
										</div>
									)}
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
										{myFollowedPages.map((page) => (
											<MyPageCard
												key={page.id}
												page={page}
												onToggle={handleToggleFollow}
											/>
										))}
									</div>
								</>
							)}

							{hasMore && tab !== "mypages" && (
								<div className="text-center mt-8">
									<Button
										variant="secondary"
										onClick={loadMore}
										disabled={isLoadingMore}
									>
										{isLoadingMore ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Loading&hellip;
											</>
										) : (
											"Load more..."
										)}
									</Button>
								</div>
							)}
						</>
					)}
				</div>

				{/* Right sidebar */}
				<aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
					{ownedPages.length > 0 && (
						<SidebarSection
							title="Pages You Manage"
							pages={ownedPages}
							buttonVariant="outline"
							buttonLabel="Edit"
						/>
					)}
					<SidebarSection
						title="Suggested pages"
						pages={suggestedPages}
						buttonVariant="default"
						buttonLabel="Like"
						onSeeAll={() => setTab("suggestions")}
						onButtonClick={handleSidebarLike}
						followedIds={sidebarFollowed}
					/>
				</aside>
			</div>

			<CreatePageDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>
		</>
	);
}

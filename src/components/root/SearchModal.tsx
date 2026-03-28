"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Search, Users, UsersRound, Flag, Loader2, Calendar, Brain,
	Video, ShoppingBag, BookOpen, ChevronLeft, ChevronRight,
} from "lucide-react";
import { globalSearch } from "@/actions/search.actions";

type SearchResult = Awaited<ReturnType<typeof globalSearch>>;
type TabKey = "people" | "groups" | "pages" | "events" | "memories" | "videos" | "marketplace" | "blogs";

const ALL_TABS: TabKey[] = ["people", "groups", "pages", "events", "videos", "marketplace", "blogs", "memories"];

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

const defaultPages = (): Record<TabKey, number> =>
	({ people: 1, groups: 1, pages: 1, events: 1, memories: 1, videos: 1, marketplace: 1, blogs: 1 });

export function SearchModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult | null>(null);
	const [totals, setTotals] = useState<SearchResult["totals"] | null>(null);
	const [pageNums, setPageNums] = useState(defaultPages());
	const [loadingMore, setLoadingMore] = useState<TabKey | null>(null);
	const [isPending, startTransition] = useTransition();
	const [activeTab, setActiveTab] = useState<TabKey>("people");
	const router = useRouter();
	const scrollRef = useRef<HTMLDivElement>(null);
	const tabsScrollRef = useRef<HTMLDivElement>(null);
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(false);

	const checkTabScroll = useCallback(() => {
		const el = tabsScrollRef.current;
		if (!el) return;
		setShowLeftArrow(el.scrollLeft > 4);
		setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
	}, []);

	useEffect(() => {
		checkTabScroll();
	}, [results, checkTabScroll]);

	const scrollTabs = (dir: "left" | "right") => {
		const el = tabsScrollRef.current;
		if (!el) return;
		el.scrollBy({ left: dir === "left" ? -150 : 150, behavior: "smooth" });
		setTimeout(checkTabScroll, 200);
	};

	useEffect(() => {
		if (!query.trim()) {
			setResults(null);
			setTotals(null);
			setPageNums(defaultPages());
			return;
		}
		setPageNums(defaultPages());
		const timer = setTimeout(() => {
			startTransition(async () => {
				const r = await globalSearch(query, 1);
				setResults(r);
				setTotals(r.totals);
			});
		}, 400);
		return () => clearTimeout(timer);
	}, [query]);

	const handleClose = () => {
		setQuery("");
		setResults(null);
		setTotals(null);
		setPageNums(defaultPages());
		onClose();
	};

	const handleNavigate = (href: string) => {
		handleClose();
		router.push(href);
	};

	const handleLoadMore = useCallback(async (tab: TabKey) => {
		if (!query.trim() || !results || loadingMore) return;
		if (!results.hasMore[tab]) return;
		const nextPage = pageNums[tab] + 1;
		setLoadingMore(tab);
		try {
			const more = await globalSearch(query, nextPage);
			setPageNums((p) => ({ ...p, [tab]: nextPage }));
			setResults((prev) => {
				if (!prev) return more;
				const merged = { ...prev };
				for (const k of ALL_TABS) {
					if (k === tab) {
						(merged as Record<string, unknown[]>)[k] = [...(prev as Record<string, unknown[]>)[k], ...(more as Record<string, unknown[]>)[k]];
					}
				}
				merged.hasMore = { ...prev.hasMore, [tab]: more.hasMore[tab] };
				merged.totals = prev.totals;
				return merged;
			});
		} finally {
			setLoadingMore(null);
		}
	}, [query, results, loadingMore, pageNums]);

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || loadingMore || !results) return;
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
			handleLoadMore(activeTab);
		}
	}, [activeTab, loadingMore, results, handleLoadMore]);

	const totalResults =
		ALL_TABS.reduce((sum, k) => sum + ((results as Record<string, unknown[]> | null)?.[k]?.length ?? 0), 0);

	const tabCount = (tab: TabKey) => {
		if (totals && totals[tab] > 0) return totals[tab];
		return (results as Record<string, unknown[]> | null)?.[tab]?.length ?? 0;
	};

	const TAB_META: { key: TabKey; icon: typeof Users; label: string }[] = [
		{ key: "people", icon: Users, label: "People" },
		{ key: "groups", icon: UsersRound, label: "Groups" },
		{ key: "pages", icon: Flag, label: "Pages" },
		{ key: "events", icon: Calendar, label: "Events" },
		{ key: "videos", icon: Video, label: "Videos" },
		{ key: "marketplace", icon: ShoppingBag, label: "Market" },
		{ key: "blogs", icon: BookOpen, label: "Blogs" },
		{ key: "memories", icon: Brain, label: "Memories" },
	];

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 border-border/80 bg-background shadow-2xl [&>button]:top-3 [&>button]:right-3 [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-muted [&>button]:p-1.5 [&>button]:opacity-100">
				<DialogHeader className="px-4 pt-4 pb-0">
					<DialogTitle className="sr-only">Search</DialogTitle>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						{isPending && (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
						)}
						<Input
							autoFocus
							placeholder="Search people, groups, pages, events, videos…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-9 pr-9 border-0 bg-muted rounded-full focus-visible:ring-0 h-10"
						/>
					</div>
				</DialogHeader>

				{!query.trim() && (
					<div className="px-4 py-10 text-center text-muted-foreground text-sm">
						Start typing to search
					</div>
				)}

				{query.trim() && results && totalResults === 0 && (
					<div className="px-4 py-10 text-center text-muted-foreground text-sm">
						No results for &quot;{query}&quot;
					</div>
				)}

				{query.trim() && results && totalResults > 0 && (
					<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="mt-2">
						<div className="relative">
							{showLeftArrow && (
								<Button
									variant="ghost"
									size="icon"
									className="absolute left-0 top-0 z-10 h-10 w-7 rounded-none bg-background/80 backdrop-blur-sm"
									onClick={() => scrollTabs("left")}
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
							)}
							<div
								ref={tabsScrollRef}
								className="overflow-x-auto scrollbar-none"
								onScroll={checkTabScroll}
							>
								<TabsList className="w-max min-w-full rounded-none border-b bg-transparent h-10 px-4 gap-1">
									{TAB_META.map(({ key, icon: Icon, label }) => (
										<TabsTrigger
											key={key}
											value={key}
											className="gap-1 data-[state=active]:bg-primary/10 rounded-md text-xs px-2.5 shrink-0"
										>
											<Icon className="h-3.5 w-3.5" />
											{label}{" "}
											{tabCount(key) > 0 && (
												<span className="text-xs text-muted-foreground">
													({tabCount(key)})
												</span>
											)}
										</TabsTrigger>
									))}
								</TabsList>
							</div>
							{showRightArrow && (
								<Button
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 z-10 h-10 w-7 rounded-none bg-background/80 backdrop-blur-sm"
									onClick={() => scrollTabs("right")}
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							)}
						</div>

						<div
							ref={scrollRef}
							onScroll={handleScroll}
							className="max-h-[500px] overflow-y-auto"
						>
							{/* People */}
							<TabsContent value="people" className="mt-0 p-2">
								{results.people.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No people found</p>
								) : (
									results.people.map((person) => {
										const name = displayName(person);
										return (
											<button key={person.id} onClick={() => handleNavigate(`/profile/${person.userName}`)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
												<Avatar className="h-10 w-10 shrink-0">
													<AvatarImage src={person.avatar?.photoSrc ?? undefined} />
													<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">{name[0]?.toUpperCase()}</AvatarFallback>
												</Avatar>
												<div className="text-left min-w-0">
													<p className="font-semibold text-sm leading-tight truncate">{name}</p>
													<p className="text-xs text-muted-foreground truncate">@{person.userName} · {person._count.followers} followers</p>
												</div>
											</button>
										);
									})
								)}
								{loadingMore === "people" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>

							{/* Groups */}
							<TabsContent value="groups" className="mt-0 p-2">
								{results.groups.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No groups found</p>
								) : (
									results.groups.map((group) => (
										<button key={group.id} onClick={() => handleNavigate(`/groups/${group.slug}`)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
											<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
												{group.avatarUrl ? <img src={group.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <UsersRound className="h-5 w-5 text-primary" />}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">{group.name}</p>
												<p className="text-xs text-muted-foreground truncate">{group.privacy} · {group._count.members} members</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "groups" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>

							{/* Pages */}
							<TabsContent value="pages" className="mt-0 p-2">
								{results.pages.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No pages found</p>
								) : (
									results.pages.map((pg) => (
										<button key={pg.id} onClick={() => handleNavigate(`/pages/${pg.slug}`)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
											<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
												{pg.avatarUrl ? <img src={pg.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <Flag className="h-5 w-5 text-primary" />}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">{pg.name}</p>
												<p className="text-xs text-muted-foreground truncate">{pg.category} · {pg._count.followers} followers</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "pages" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>

							{/* Events */}
							<TabsContent value="events" className="mt-0 p-2">
								{results.events.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No events found</p>
								) : (
									results.events.map((event) => (
										<button key={event.id} onClick={() => handleNavigate(`/events/${event.slug}`)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
											<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
												{event.coverUrl ? <img src={event.coverUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <Calendar className="h-5 w-5 text-primary" />}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">{event.title}</p>
												<p className="text-xs text-muted-foreground truncate">
													{event.startDate ? new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""}
													{event.location ? ` · ${event.location}` : event.isOnline ? " · Online" : ""}
													{" · "}{event._count.attendees} attending
												</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "events" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>

							{/* Videos */}
							<TabsContent value="videos" className="mt-0 p-2">
								{results.videos.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No videos found</p>
								) : (
									results.videos.map((vid) => {
										const vName = displayName(vid.author);
										return (
											<button key={vid.id} onClick={() => handleNavigate(`/videos`)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
												<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
													{vid.thumbnailUrl ? <img src={vid.thumbnailUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <Video className="h-5 w-5 text-primary" />}
												</div>
												<div className="text-left min-w-0 flex-1">
													<p className="font-semibold text-sm leading-tight truncate">{vid.title}</p>
													<p className="text-xs text-muted-foreground truncate">{vName} · {vid._count.likes} likes · {vid._count.comments} comments</p>
												</div>
											</button>
										);
									})
								)}
								{loadingMore === "videos" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>

							{/* Marketplace */}
							<TabsContent value="marketplace" className="mt-0 p-2">
								{results.marketplace.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No listings found</p>
								) : (
									results.marketplace.map((listing) => (
										<button key={listing.id} onClick={() => handleNavigate(`/marketplace/${listing.slug}`)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
											<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
												{listing.images?.[0]?.url ? <img src={listing.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <ShoppingBag className="h-5 w-5 text-primary" />}
											</div>
											<div className="text-left min-w-0 flex-1">
												<p className="font-semibold text-sm leading-tight truncate">{listing.title}</p>
												<p className="text-xs text-muted-foreground truncate">
													{listing.isFree ? "Free" : `$${listing.price.toFixed(2)}`} · {listing.condition} · {listing.category}
													{listing.location ? ` · ${listing.location}` : ""}
												</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "marketplace" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>

							{/* Blogs */}
							<TabsContent value="blogs" className="mt-0 p-2">
								{results.blogs.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No blogs found</p>
								) : (
									results.blogs.map((blog) => {
										const bName = displayName(blog.author);
										return (
											<button key={blog.id} onClick={() => handleNavigate(`/blogs/${blog.slug}`)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
												<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
													{blog.coverImageUrl ? <img src={blog.coverImageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <BookOpen className="h-5 w-5 text-primary" />}
												</div>
												<div className="text-left min-w-0 flex-1">
													<p className="font-semibold text-sm leading-tight truncate">{blog.title}</p>
													<p className="text-xs text-muted-foreground truncate">
														{bName} · {blog._count.likes} likes
														{blog.excerpt ? ` · ${blog.excerpt.slice(0, 60)}…` : ""}
													</p>
												</div>
											</button>
										);
									})
								)}
								{loadingMore === "blogs" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>

							{/* Memories */}
							<TabsContent value="memories" className="mt-0 p-2">
								{results.memories.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">No memories found</p>
								) : (
									results.memories.map((memory) => (
										<button key={memory.id} onClick={() => memory.post ? handleNavigate(`/post/${memory.post.id}`) : undefined} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
											<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
												{memory.post?.media?.[0]?.url ? <img src={memory.post.media[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <Brain className="h-5 w-5 text-primary" />}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">{memory.note || "Memory"}</p>
												<p className="text-xs text-muted-foreground truncate">{new Date(memory.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "memories" && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
							</TabsContent>
						</div>
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
}

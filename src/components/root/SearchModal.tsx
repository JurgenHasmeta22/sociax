"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, UsersRound, Flag, Loader2, Calendar, Brain } from "lucide-react";
import { globalSearch } from "@/actions/search.actions";

type SearchResult = Awaited<ReturnType<typeof globalSearch>>;
type TabKey = "people" | "groups" | "pages" | "events" | "memories";

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

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
	const [pageNums, setPageNums] = useState<Record<TabKey, number>>({ people: 1, groups: 1, pages: 1, events: 1, memories: 1 });
	const [loadingMore, setLoadingMore] = useState<TabKey | null>(null);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!query.trim()) {
			setResults(null);
			setTotals(null);
			setPageNums({ people: 1, groups: 1, pages: 1, events: 1, memories: 1 });
			return;
		}
		setPageNums({ people: 1, groups: 1, pages: 1, events: 1, memories: 1 });
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
		setPageNums({ people: 1, groups: 1, pages: 1, events: 1, memories: 1 });
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
				return {
					...prev,
					people: tab === "people" ? [...prev.people, ...more.people] : prev.people,
					groups: tab === "groups" ? [...prev.groups, ...more.groups] : prev.groups,
					pages: tab === "pages" ? [...prev.pages, ...more.pages] : prev.pages,
					events: tab === "events" ? [...prev.events, ...more.events] : prev.events,
					memories: tab === "memories" ? [...prev.memories, ...more.memories] : prev.memories,
					hasMore: { ...prev.hasMore, [tab]: more.hasMore[tab] },
					totals: prev.totals,
				};
			});
		} finally {
			setLoadingMore(null);
		}
	}, [query, results, loadingMore, pageNums]);

	const [activeTab, setActiveTab] = useState<TabKey>("people");

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el || loadingMore || !results) return;
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
			handleLoadMore(activeTab);
		}
	}, [activeTab, loadingMore, results, handleLoadMore]);

	const totalResults =
		(results?.people.length ?? 0) +
		(results?.groups.length ?? 0) +
		(results?.pages.length ?? 0) +
		(results?.events.length ?? 0) +
		(results?.memories.length ?? 0);

	const tabCount = (tab: TabKey) => {
		if (totals && totals[tab] > 0) return totals[tab];
		return results?.[tab]?.length ?? 0;
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
				<DialogHeader className="px-4 pt-4 pb-0">
					<DialogTitle className="sr-only">Search</DialogTitle>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						{isPending && (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
						)}
						<Input
							autoFocus
							placeholder="Search people, groups, pages, events…"
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
						<div className="overflow-x-auto">
							<TabsList className="w-max min-w-full rounded-none border-b bg-transparent h-10 px-4 gap-1">
								<TabsTrigger
									value="people"
									className="gap-1 data-[state=active]:bg-primary/10 rounded-md text-xs px-2.5"
								>
									<Users className="h-3.5 w-3.5" />
									People{" "}
									{tabCount("people") > 0 && (
										<span className="text-xs text-muted-foreground">
											({tabCount("people")})
										</span>
									)}
								</TabsTrigger>
								<TabsTrigger
									value="groups"
									className="gap-1 data-[state=active]:bg-primary/10 rounded-md text-xs px-2.5"
								>
									<UsersRound className="h-3.5 w-3.5" />
									Groups{" "}
									{tabCount("groups") > 0 && (
										<span className="text-xs text-muted-foreground">
											({tabCount("groups")})
										</span>
									)}
								</TabsTrigger>
								<TabsTrigger
									value="pages"
									className="gap-1 data-[state=active]:bg-primary/10 rounded-md text-xs px-2.5"
								>
									<Flag className="h-3.5 w-3.5" />
									Pages{" "}
									{tabCount("pages") > 0 && (
										<span className="text-xs text-muted-foreground">
											({tabCount("pages")})
										</span>
									)}
								</TabsTrigger>
								<TabsTrigger
									value="events"
									className="gap-1 data-[state=active]:bg-primary/10 rounded-md text-xs px-2.5"
								>
									<Calendar className="h-3.5 w-3.5" />
									Events{" "}
									{tabCount("events") > 0 && (
										<span className="text-xs text-muted-foreground">
											({tabCount("events")})
										</span>
									)}
								</TabsTrigger>
								<TabsTrigger
									value="memories"
									className="gap-1 data-[state=active]:bg-primary/10 rounded-md text-xs px-2.5"
								>
									<Brain className="h-3.5 w-3.5" />
									Memories{" "}
									{tabCount("memories") > 0 && (
										<span className="text-xs text-muted-foreground">
											({tabCount("memories")})
										</span>
									)}
								</TabsTrigger>
							</TabsList>
						</div>

						<div
							ref={scrollRef}
							onScroll={handleScroll}
							className="max-h-[400px] overflow-y-auto"
						>
							<TabsContent value="people" className="mt-0 p-2">
								{results.people.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">
										No people found
									</p>
								) : (
									results.people.map((person) => {
										const name = displayName(person);
										return (
											<button
												key={person.id}
												onClick={() =>
													handleNavigate(
														`/profile/${person.userName}`,
													)
												}
												className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
											>
												<Avatar className="h-10 w-10 shrink-0">
													<AvatarImage
														src={
															person.avatar
																?.photoSrc ??
															undefined
														}
													/>
													<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
														{name[0]?.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="text-left min-w-0">
													<p className="font-semibold text-sm leading-tight truncate">
														{name}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														@{person.userName} ·{" "}
														{person._count.followers}{" "}
														followers
													</p>
												</div>
											</button>
										);
									})
								)}
								{loadingMore === "people" && (
									<div className="flex justify-center py-3">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								)}
							</TabsContent>

							<TabsContent value="groups" className="mt-0 p-2">
								{results.groups.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">
										No groups found
									</p>
								) : (
									results.groups.map((group) => (
										<button
											key={group.id}
											onClick={() =>
												handleNavigate(
													`/groups/${group.slug}`,
												)
											}
											className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
										>
											<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
												{group.avatarUrl ? (
													<img
														src={group.avatarUrl}
														alt=""
														className="h-10 w-10 rounded-full object-cover"
													/>
												) : (
													<UsersRound className="h-5 w-5 text-primary" />
												)}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">
													{group.name}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{group.privacy} ·{" "}
													{group._count.members}{" "}
													members
												</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "groups" && (
									<div className="flex justify-center py-3">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								)}
							</TabsContent>

							<TabsContent value="pages" className="mt-0 p-2">
								{results.pages.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">
										No pages found
									</p>
								) : (
									results.pages.map((page) => (
										<button
											key={page.id}
											onClick={() =>
												handleNavigate(
													`/pages/${page.slug}`,
												)
											}
											className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
										>
											<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
												{page.avatarUrl ? (
													<img
														src={page.avatarUrl}
														alt=""
														className="h-10 w-10 rounded-full object-cover"
													/>
												) : (
													<Flag className="h-5 w-5 text-primary" />
												)}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">
													{page.name}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{page.category} ·{" "}
													{page._count.followers}{" "}
													followers
												</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "pages" && (
									<div className="flex justify-center py-3">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								)}
							</TabsContent>

							<TabsContent value="events" className="mt-0 p-2">
								{results.events.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">
										No events found
									</p>
								) : (
									results.events.map((event) => (
										<button
											key={event.id}
											onClick={() =>
												handleNavigate(
													`/events/${event.slug}`,
												)
											}
											className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
										>
											<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
												{event.coverUrl ? (
													<img
														src={event.coverUrl}
														alt=""
														className="h-10 w-10 rounded-lg object-cover"
													/>
												) : (
													<Calendar className="h-5 w-5 text-primary" />
												)}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">
													{event.title}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{event.startDate
														? new Date(event.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
														: ""}
													{event.location ? ` · ${event.location}` : event.isOnline ? " · Online" : ""}
													{" · "}{event._count.attendees} attending
												</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "events" && (
									<div className="flex justify-center py-3">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								)}
							</TabsContent>

							<TabsContent value="memories" className="mt-0 p-2">
								{results.memories.length === 0 ? (
									<p className="text-center text-sm text-muted-foreground py-8">
										No memories found
									</p>
								) : (
									results.memories.map((memory) => (
										<button
											key={memory.id}
											onClick={() =>
												memory.post
													? handleNavigate(`/post/${memory.post.id}`)
													: undefined
											}
											className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors"
										>
											<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
												{memory.post?.media?.[0]?.url ? (
													<img
														src={memory.post.media[0].url}
														alt=""
														className="h-10 w-10 rounded-lg object-cover"
													/>
												) : (
													<Brain className="h-5 w-5 text-primary" />
												)}
											</div>
											<div className="text-left min-w-0">
												<p className="font-semibold text-sm leading-tight truncate">
													{memory.note || "Memory"}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{new Date(memory.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
												</p>
											</div>
										</button>
									))
								)}
								{loadingMore === "memories" && (
									<div className="flex justify-center py-3">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								)}
							</TabsContent>
						</div>
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
}

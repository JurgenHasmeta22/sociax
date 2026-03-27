"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, UsersRound, Flag, Loader2 } from "lucide-react";
import { globalSearch } from "@/actions/search.actions";
import { cn } from "@/lib/utils";

type SearchResult = Awaited<ReturnType<typeof globalSearch>>;

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
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	useEffect(() => {
		if (!query.trim()) {
			setResults(null);
			return;
		}
		const timer = setTimeout(() => {
			startTransition(async () => {
				const r = await globalSearch(query);
				setResults(r);
			});
		}, 400);
		return () => clearTimeout(timer);
	}, [query]);

	const handleClose = () => {
		setQuery("");
		setResults(null);
		onClose();
	};

	const handleNavigate = (href: string) => {
		handleClose();
		router.push(href);
	};

	const totalResults =
		(results?.people.length ?? 0) +
		(results?.groups.length ?? 0) +
		(results?.pages.length ?? 0);

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
							placeholder="Search people, groups, pages…"
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
					<Tabs defaultValue="people" className="mt-2">
						<TabsList className="w-full rounded-none border-b bg-transparent h-10 px-4 gap-2">
							<TabsTrigger
								value="people"
								className="gap-1.5 data-[state=active]:bg-primary/10 rounded-md"
							>
								<Users className="h-3.5 w-3.5" />
								People{" "}
								{results.people.length > 0 && (
									<span className="text-xs text-muted-foreground">
										({results.people.length})
									</span>
								)}
							</TabsTrigger>
							<TabsTrigger
								value="groups"
								className="gap-1.5 data-[state=active]:bg-primary/10 rounded-md"
							>
								<UsersRound className="h-3.5 w-3.5" />
								Groups{" "}
								{results.groups.length > 0 && (
									<span className="text-xs text-muted-foreground">
										({results.groups.length})
									</span>
								)}
							</TabsTrigger>
							<TabsTrigger
								value="pages"
								className="gap-1.5 data-[state=active]:bg-primary/10 rounded-md"
							>
								<Flag className="h-3.5 w-3.5" />
								Pages{" "}
								{results.pages.length > 0 && (
									<span className="text-xs text-muted-foreground">
										({results.pages.length})
									</span>
								)}
							</TabsTrigger>
						</TabsList>

						<ScrollArea className="max-h-[360px]">
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
														{
															person._count
																.followers
														}{" "}
														followers
													</p>
												</div>
											</button>
										);
									})
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
							</TabsContent>
						</ScrollArea>
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
}

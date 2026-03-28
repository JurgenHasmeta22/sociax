"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Loader2 } from "lucide-react";
import { PersonCard } from "@/components/people/PersonCard";
import { fetchMorePeople } from "@/actions/follow.actions";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type FollowState =
	| "none"
	| "outgoing_pending"
	| "incoming_pending"
	| "accepted";

type Person = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	location: string | null;
	avatar: { photoSrc: string } | null;
	_count: { following: number; posts: number };
};

export function PeopleClient({
	initialPeople,
	initialFollowStates,
	total: initialTotal,
	initialQuery,
}: {
	initialPeople: Person[];
	initialFollowStates: Record<number, FollowState>;
	total: number;
	initialQuery: string;
}) {
	const [people, setPeople] = useState<Person[]>(initialPeople);
	const [followStates, setFollowStates] =
		useState<Record<number, FollowState>>(initialFollowStates);
	const [total, setTotal] = useState(initialTotal);
	const [query, setQuery] = useState(initialQuery);
	const [skip, setSkip] = useState(initialPeople.length);
	const [isPending, startTransition] = useTransition();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			startTransition(async () => {
				const result = await fetchMorePeople(0, query);
				setPeople(result.people as Person[]);
				setFollowStates(result.followStates);
				setTotal(result.total);
				setSkip(result.people.length);
			});
		}, 500);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	const handleLoadMore = () => {
		startTransition(async () => {
			const result = await fetchMorePeople(skip, query);
			setPeople((p) => [...p, ...(result.people as Person[])]);
			setFollowStates((p) => ({ ...p, ...result.followStates }));
			setSkip((p) => p + result.people.length);
		});
	};

	const hasMore = people.length < total;
	const sentinelRef = useInfiniteScroll(handleLoadMore, { hasMore, loading: isPending });

	return (
		<div className="max-w-5xl mx-auto px-4 py-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold">People</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Discover people to connect with
					</p>
				</div>
				<div className="relative w-full sm:w-72">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search people..."
						className="pl-9 rounded-full"
					/>
				</div>
			</div>

			{isPending && people.length === 0 ? (
				<div className="flex justify-center py-20">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			) : people.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					<Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
					<p className="font-medium text-lg">No people found</p>
					<p className="text-sm mt-1">Try a different search term</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
						{people.map((person) => (
							<PersonCard
								key={person.id}
								person={person}
								initialFollowState={
									followStates[person.id] ?? "none"
								}
							/>
						))}
					</div>

					{hasMore && (
						<div ref={sentinelRef} className="flex justify-center py-6">
							{isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
						</div>
					)}
				</>
			)}
		</div>
	);
}

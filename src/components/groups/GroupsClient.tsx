"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Globe, Lock, Users, Plus, Search, Loader2 } from "lucide-react";
import { GroupJoinButton } from "@/components/groups/GroupJoinButton";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { fetchMoreGroups } from "@/actions/group.actions";

const PRIVACY_CONFIG = {
	Public: { icon: Globe, label: "Public" },
	Private: { icon: Lock, label: "Private" },
	Secret: { icon: Lock, label: "Secret" },
} as const;

type Group = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	coverUrl: string | null;
	avatarUrl: string | null;
	privacy: string;
	owner: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	_count: { members: number; posts: number };
};

export function GroupsClient({
	initialGroups,
	total: initialTotal,
	initialQuery,
	membershipMap: initialMembershipMap,
	isLoggedIn,
}: {
	initialGroups: Group[];
	total: number;
	initialQuery: string;
	membershipMap: Record<number, string>;
	isLoggedIn: boolean;
}) {
	const [groups, setGroups] = useState<Group[]>(initialGroups);
	const [membershipMap, setMembershipMap] =
		useState<Record<number, string>>(initialMembershipMap);
	const [total, setTotal] = useState(initialTotal);
	const [query, setQuery] = useState(initialQuery);
	const [skip, setSkip] = useState(initialGroups.length);
	const [isPending, startTransition] = useTransition();
	const [showCreate, setShowCreate] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			startTransition(async () => {
				const result = await fetchMoreGroups(0, query);
				setGroups(result.groups as Group[]);
				setMembershipMap(result.membershipMap);
				setTotal(result.total);
				setSkip(result.groups.length);
			});
		}, 500);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	const handleLoadMore = () => {
		startTransition(async () => {
			const result = await fetchMoreGroups(skip, query);
			setGroups((p) => [...p, ...(result.groups as Group[])]);
			setMembershipMap((p) => ({ ...p, ...result.membershipMap }));
			setSkip((p) => p + result.groups.length);
		});
	};

	const hasMore = groups.length < total;

	return (
		<div className="max-w-5xl mx-auto px-4 py-8">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold">Groups</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Discover and join communities
					</p>
				</div>
				<div className="flex gap-2 w-full sm:w-auto">
					<div className="relative flex-1 sm:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search groups..."
							className="pl-9 rounded-full"
						/>
					</div>
					{isLoggedIn && (
						<Button
							className="gap-2 font-semibold shrink-0"
							onClick={() => setShowCreate(true)}
						>
							<Plus className="h-4 w-4" />
							Create group
						</Button>
					)}
				</div>
			</div>

			{isPending && groups.length === 0 ? (
				<div className="flex justify-center py-20">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			) : groups.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					<Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
					<p className="font-medium text-lg">No groups found</p>
					<p className="text-sm mt-1">Try a different search term</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{groups.map((group) => {
							const privacyKey =
								group.privacy as keyof typeof PRIVACY_CONFIG;
							const { icon: PrivacyIcon, label: privacyLabel } =
								PRIVACY_CONFIG[privacyKey] ??
								PRIVACY_CONFIG.Public;
							const ownerName =
								[group.owner.firstName, group.owner.lastName]
									.filter(Boolean)
									.join(" ") || group.owner.userName;

							return (
								<Card
									key={group.id}
									className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
								>
									<Link href={`/groups/${group.slug}`}>
										<div className="relative h-36 bg-muted">
											{group.coverUrl ? (
												<Image
													src={group.coverUrl}
													alt={group.name}
													fill
													className="object-cover"
													sizes="400px"
												/>
											) : (
												<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
													<Users className="h-12 w-12 text-primary/40" />
												</div>
											)}
											<div className="absolute top-2 right-2">
												<Badge
													variant="secondary"
													className="gap-1 text-xs bg-background/90 backdrop-blur"
												>
													<PrivacyIcon className="h-3 w-3" />
													{privacyLabel}
												</Badge>
											</div>
											{group.avatarUrl && (
												<div className="absolute -bottom-5 left-4">
													<div className="relative w-10 h-10 rounded-full ring-2 ring-background overflow-hidden bg-muted">
														<Image
															src={
																group.avatarUrl
															}
															alt=""
															fill
															className="object-cover"
															sizes="40px"
														/>
													</div>
												</div>
											)}
										</div>
									</Link>
									<CardContent
										className={
											group.avatarUrl
												? "pt-7 pb-4"
												: "pt-4 pb-4"
										}
									>
										<Link href={`/groups/${group.slug}`}>
											<h3 className="font-bold text-base leading-tight truncate hover:underline">
												{group.name}
											</h3>
										</Link>
										{group.description && (
											<p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
												{group.description}
											</p>
										)}
										<div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
											<span className="flex items-center gap-1">
												<Users className="h-3.5 w-3.5" />
												{group._count.members.toLocaleString()}{" "}
												members
											</span>
											<span>
												{group._count.posts} posts
											</span>
										</div>
										<div className="flex items-center gap-2 mt-3">
											<Link
												href={`/profile/${group.owner.userName}`}
											>
												<Avatar className="h-5 w-5">
													<AvatarImage
														src={
															group.owner.avatar
																?.photoSrc ??
															undefined
														}
													/>
													<AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
														{ownerName[0]?.toUpperCase()}
													</AvatarFallback>
												</Avatar>
											</Link>
											<span className="text-xs text-muted-foreground truncate">
												by{" "}
												<Link
													href={`/profile/${group.owner.userName}`}
													className="font-medium text-foreground hover:underline"
												>
													{ownerName}
												</Link>
											</span>
										</div>
										{isLoggedIn && (
											<GroupJoinButton
												groupId={group.id}
												initialState={
													(membershipMap[group.id] ??
														"none") as
														| "none"
														| "Pending"
														| "Approved"
														| "Banned"
												}
												privacy={group.privacy}
											/>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>

					{hasMore && (
						<div className="flex justify-center mt-6">
							<Button
								variant="outline"
								onClick={handleLoadMore}
								disabled={isPending}
								className="min-w-36"
							>
								{isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Load more"
								)}
							</Button>
						</div>
					)}
				</>
			)}

			{isLoggedIn && (
				<CreateGroupDialog
					open={showCreate}
					onClose={() => setShowCreate(false)}
				/>
			)}
		</div>
	);
}

"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users } from "lucide-react";
import { getPageFollowers } from "@/actions/page.actions";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type Follower = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

const displayName = (u: Follower) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function PageFollowersModal({
	pageId,
	followerCount,
}: {
	pageId: number;
	followerCount: number;
}) {
	const [open, setOpen] = useState(false);
	const [followers, setFollowers] = useState<Follower[]>([]);
	const [hasMore, setHasMore] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [isPending, startTransition] = useTransition();

	const loadFollowers = useCallback(
		(skip: number, replace = false) => {
			startTransition(async () => {
				const result = await getPageFollowers(pageId, skip);
				setFollowers((prev) =>
					replace ? result.followers : [...prev, ...result.followers],
				);
				setHasMore(result.hasMore);
				setLoaded(true);
			});
		},
		[pageId],
	);

	const loadMoreFollowers = useCallback(() => {
		loadFollowers(followers.length);
	}, [loadFollowers, followers.length]);

	const sentinelRef = useInfiniteScroll(loadMoreFollowers, { hasMore, loading: isPending });

	const handleOpen = () => {
		setOpen(true);
		if (!loaded) loadFollowers(0, true);
	};

	return (
		<>
			<button
				onClick={handleOpen}
				className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground hover:underline transition-colors"
			>
				<Users className="h-3.5 w-3.5" />
				{followerCount.toLocaleString()} follower
				{followerCount !== 1 ? "s" : ""}
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>
							Followers ({followerCount.toLocaleString()})
						</DialogTitle>
					</DialogHeader>

					<div className="max-h-[420px] overflow-y-auto space-y-1">
						{!loaded && isPending && (
							<div className="flex justify-center py-8">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						)}
						{followers.map((f) => (
							<Link
								key={f.id}
								href={`/profile/${f.userName}`}
								onClick={() => setOpen(false)}
								className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
							>
								<Avatar className="h-9 w-9 shrink-0">
									<AvatarImage
										src={f.avatar?.photoSrc ?? undefined}
									/>
									<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
										{displayName(f)[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="font-semibold text-sm truncate">
										{displayName(f)}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										@{f.userName}
									</p>
								</div>
							</Link>
						))}
						{loaded && followers.length === 0 && (
							<p className="text-sm text-muted-foreground text-center py-8">
								No followers yet.
							</p>
						)}
					</div>

					{hasMore && (
						<div ref={sentinelRef} className="flex justify-center py-3">
							{isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

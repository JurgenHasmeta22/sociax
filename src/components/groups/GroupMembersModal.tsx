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
import { Loader2, UserPlus, Users } from "lucide-react";
import { getGroupMembers } from "@/actions/group.actions";
import {
	sendFollowRequest,
	cancelFollowRequest,
} from "@/actions/follow.actions";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type Member = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
	role: string;
};

const displayName = (u: Member) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

function MemberRow({
	member,
	currentUserId,
	initialFollowState,
}: {
	member: Member;
	currentUserId: number | null;
	initialFollowState: "none" | "pending" | "accepted";
}) {
	const [followState, setFollowState] = useState(initialFollowState);
	const [isPending, startTransition] = useTransition();

	const isMe = currentUserId === member.id;

	const handleAddFriend = () => {
		if (followState === "none") {
			setFollowState("pending");
			startTransition(() => sendFollowRequest(member.id));
		} else if (followState === "pending") {
			setFollowState("none");
			startTransition(() => cancelFollowRequest(member.id));
		}
	};

	return (
		<div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors">
			<Link
				href={`/profile/${member.userName}`}
				className="flex items-center gap-3 flex-1 min-w-0"
			>
				<Avatar className="h-9 w-9 shrink-0">
					<AvatarImage src={member.avatar?.photoSrc ?? undefined} />
					<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
						{displayName(member)[0]?.toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0">
					<p className="font-semibold text-sm truncate">
						{displayName(member)}
					</p>
					<p className="text-xs text-muted-foreground truncate">
						@{member.userName}
						{member.role === "Admin" && (
							<span className="ml-1 text-primary font-medium">
								· Admin
							</span>
						)}
						{member.role === "Moderator" && (
							<span className="ml-1 text-orange-500 font-medium">
								· Mod
							</span>
						)}
					</p>
				</div>
			</Link>
			{currentUserId && !isMe && followState !== "accepted" && (
				<Button
					variant={
						followState === "pending" ? "outline" : "secondary"
					}
					size="sm"
					className="shrink-0 h-8 text-xs gap-1.5"
					disabled={isPending}
					onClick={handleAddFriend}
				>
					<UserPlus className="h-3.5 w-3.5" />
					{followState === "pending" ? "Requested" : "Add friend"}
				</Button>
			)}
			{followState === "accepted" && !isMe && (
				<span className="text-xs text-muted-foreground shrink-0">
					Friends
				</span>
			)}
		</div>
	);
}

export function GroupMembersModal({
	groupId,
	memberCount,
	currentUserId,
	initialFollowStates = {},
}: {
	groupId: number;
	memberCount: number;
	currentUserId: number | null;
	initialFollowStates?: Record<number, "none" | "pending" | "accepted">;
}) {
	const [open, setOpen] = useState(false);
	const [members, setMembers] = useState<Member[]>([]);
	const [hasMore, setHasMore] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [isPending, startTransition] = useTransition();

	const loadMembers = useCallback(
		(skip: number, replace = false) => {
			startTransition(async () => {
				const result = await getGroupMembers(groupId, skip);
				setMembers((prev) =>
					replace ? result.members : [...prev, ...result.members],
				);
				setHasMore(result.hasMore);
				setLoaded(true);
			});
		},
		[groupId],
	);

	const loadMoreMembers = useCallback(() => {
		loadMembers(members.length);
	}, [loadMembers, members.length]);

	const sentinelRef = useInfiniteScroll(loadMoreMembers, { hasMore, loading: isPending });

	const handleOpen = () => {
		setOpen(true);
		if (!loaded) loadMembers(0, true);
	};

	return (
		<>
			<button
				onClick={handleOpen}
				className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
			>
				<Users className="h-3.5 w-3.5" />
				{memberCount.toLocaleString()} member
				{memberCount !== 1 ? "s" : ""}
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>
							Members ({memberCount.toLocaleString()})
						</DialogTitle>
					</DialogHeader>

					<div className="max-h-[420px] overflow-y-auto space-y-1">
						{!loaded && isPending && (
							<div className="flex justify-center py-8">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						)}
						{members.map((m) => (
							<MemberRow
								key={m.id}
								member={m}
								currentUserId={currentUserId}
								initialFollowState={
									initialFollowStates[m.id] ?? "none"
								}
							/>
						))}
						{loaded && members.length === 0 && (
							<p className="text-sm text-muted-foreground text-center py-8">
								No members yet.
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

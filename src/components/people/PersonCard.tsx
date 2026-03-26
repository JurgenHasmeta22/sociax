"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, UserPlus, UserCheck, Clock, UserX } from "lucide-react";
import {
	sendFollowRequest,
	cancelFollowRequest,
	acceptFollowRequest,
	rejectFollowRequest,
	unfollowUser,
} from "@/actions/follow.actions";

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
	_count: { followers: number; posts: number };
};

export function PersonCard({
	person,
	initialFollowState,
}: {
	person: Person;
	initialFollowState: FollowState;
}) {
	const [state, setState] = useState<FollowState>(initialFollowState);
	const [isPending, startTransition] = useTransition();

	const name =
		[person.firstName, person.lastName].filter(Boolean).join(" ") ||
		person.userName;

	const handleSend = () => {
		setState("outgoing_pending");
		startTransition(() => sendFollowRequest(person.id));
	};

	const handleCancel = () => {
		setState("none");
		startTransition(() => cancelFollowRequest(person.id));
	};

	const handleAccept = () => {
		setState("accepted");
		startTransition(() => acceptFollowRequest(person.id));
	};

	const handleReject = () => {
		setState("none");
		startTransition(() => rejectFollowRequest(person.id));
	};

	const handleUnfollow = () => {
		setState("none");
		startTransition(() => unfollowUser(person.id));
	};

	return (
		<Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
			<Link href={`/profile/${person.userName}`}>
				<div className="relative h-28 bg-muted">
					{person.avatar ? (
						<Avatar className="w-full h-full rounded-none">
							<AvatarImage
								src={person.avatar.photoSrc}
								className="object-cover"
							/>
							<AvatarFallback className="rounded-none text-3xl bg-primary text-primary-foreground h-full w-full">
								{name[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					) : (
						<div className="w-full h-full bg-primary/10 flex items-center justify-center">
							<span className="text-4xl font-bold text-primary/40">
								{name[0]?.toUpperCase()}
							</span>
						</div>
					)}
				</div>
			</Link>
			<CardContent className="p-3">
				<Link href={`/profile/${person.userName}`}>
					<p className="font-semibold text-sm leading-tight truncate hover:underline">
						{name}
					</p>
				</Link>
				<p className="text-xs text-muted-foreground truncate mt-0.5">
					@{person.userName}
				</p>
				{person.location && (
					<p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
						<MapPin className="h-3 w-3 shrink-0" />
						{person.location}
					</p>
				)}
				<div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Users className="h-3 w-3" />
						{person._count.followers}
					</span>
					<Badge variant="outline" className="text-[10px] h-4 px-1">
						{person._count.posts} posts
					</Badge>
				</div>

				{state === "none" && (
					<Button
						size="sm"
						className="w-full mt-3 gap-1.5 h-7 text-xs font-semibold"
						onClick={handleSend}
						disabled={isPending}
					>
						<UserPlus className="h-3 w-3" />
						Add friend
					</Button>
				)}

				{state === "outgoing_pending" && (
					<Button
						size="sm"
						variant="outline"
						className="w-full mt-3 gap-1.5 h-7 text-xs font-semibold"
						onClick={handleCancel}
						disabled={isPending}
					>
						<Clock className="h-3 w-3" />
						Requested
					</Button>
				)}

				{state === "incoming_pending" && (
					<div className="flex gap-1.5 mt-3">
						<Button
							size="sm"
							className="flex-1 h-7 text-xs font-semibold gap-1"
							onClick={handleAccept}
							disabled={isPending}
						>
							<UserCheck className="h-3 w-3" />
							Accept
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="flex-1 h-7 text-xs font-semibold gap-1"
							onClick={handleReject}
							disabled={isPending}
						>
							<UserX className="h-3 w-3" />
							Decline
						</Button>
					</div>
				)}

				{state === "accepted" && (
					<Button
						size="sm"
						variant="secondary"
						className="w-full mt-3 gap-1.5 h-7 text-xs font-semibold"
						onClick={handleUnfollow}
						disabled={isPending}
					>
						<UserCheck className="h-3 w-3" />
						Following
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

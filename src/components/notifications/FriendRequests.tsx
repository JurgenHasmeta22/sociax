"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, UserCheck, UserX } from "lucide-react";
import {
	acceptFollowRequest,
	rejectFollowRequest,
} from "@/actions/follow.actions";

type Request = {
	followerId: number;
	createdAt: Date;
	follower: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		location: string | null;
		avatar: { photoSrc: string } | null;
		_count: { following: number };
	};
};

function RequestCard({
	request,
	onHandled,
}: {
	request: Request;
	onHandled: (followerId: number) => void;
}) {
	const [isPending, startTransition] = useTransition();
	const { follower } = request;
	const name =
		[follower.firstName, follower.lastName].filter(Boolean).join(" ") ||
		follower.userName;

	const handleAccept = () => {
		onHandled(follower.id);
		startTransition(() => acceptFollowRequest(follower.id));
	};

	const handleReject = () => {
		onHandled(follower.id);
		startTransition(() => rejectFollowRequest(follower.id));
	};

	return (
		<Card className="shadow-sm">
			<CardContent className="p-4 flex items-center gap-3">
				<Link
					href={`/profile/${follower.userName}`}
					className="shrink-0"
				>
					<Avatar className="h-12 w-12">
						<AvatarImage
							src={follower.avatar?.photoSrc ?? undefined}
						/>
						<AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
							{name[0]?.toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</Link>
				<div className="flex-1 min-w-0">
					<Link
						href={`/profile/${follower.userName}`}
						className="font-semibold text-sm hover:underline block truncate"
					>
						{name}
					</Link>
					<div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
						<span>@{follower.userName}</span>
						<span className="flex items-center gap-0.5">
							<Users className="h-3 w-3" />
							{follower._count.following} friends
						</span>
						{follower.location && (
							<span className="flex items-center gap-0.5">
								<MapPin className="h-3 w-3" />
								{follower.location}
							</span>
						)}
					</div>
				</div>
				<div className="flex gap-2 shrink-0">
					<Button
						size="sm"
						className="gap-1.5 font-semibold"
						onClick={handleAccept}
						disabled={isPending}
					>
						<UserCheck className="h-3.5 w-3.5" />
						Accept
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="gap-1.5 font-semibold"
						onClick={handleReject}
						disabled={isPending}
					>
						<UserX className="h-3.5 w-3.5" />
						Decline
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export function FriendRequests({ requests }: { requests: Request[] }) {
	const [list, setList] = useState<Request[]>(requests);

	const handleHandled = (followerId: number) => {
		setList((p) => p.filter((r) => r.follower.id !== followerId));
	};

	if (list.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No pending friend requests.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{list.map((r) => (
				<RequestCard
					key={r.followerId}
					request={r}
					onHandled={handleHandled}
				/>
			))}
		</div>
	);
}

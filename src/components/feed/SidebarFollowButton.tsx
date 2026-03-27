"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import {
	sendFollowRequest,
	cancelFollowRequest,
	unfollowUser,
} from "@/actions/follow.actions";

type FollowState = "none" | "outgoing_pending" | "accepted";

export function SidebarFollowButton({
	userId,
	initialState,
}: {
	userId: number;
	initialState: FollowState;
}) {
	const [state, setState] = useState<FollowState>(initialState);
	const [isPending, startTransition] = useTransition();

	if (state === "none") {
		return (
			<Button
				size="sm"
				variant="secondary"
				className="mt-1.5 gap-1.5 h-8 text-xs w-full font-semibold"
				onClick={() => {
					setState("outgoing_pending");
					startTransition(() => sendFollowRequest(userId));
				}}
				disabled={isPending}
			>
				<UserPlus className="h-3.5 w-3.5" />
				Add friend
			</Button>
		);
	}

	if (state === "outgoing_pending") {
		return (
			<Button
				size="sm"
				variant="outline"
				className="shrink-0 gap-1.5 h-7 text-xs px-2.5 font-semibold"
				onClick={() => {
					setState("none");
					startTransition(() => cancelFollowRequest(userId));
				}}
				disabled={isPending}
			>
				<Clock className="h-3.5 w-3.5" />
				Requested
			</Button>
		);
	}

	return (
		<Button
			size="sm"
			variant="secondary"
			className="shrink-0 gap-1.5 h-7 text-xs px-2.5 font-semibold"
			onClick={() => {
				setState("none");
				startTransition(() => unfollowUser(userId));
			}}
			disabled={isPending}
		>
			<UserCheck className="h-3.5 w-3.5" />
			Friends
		</Button>
	);
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, UserX } from "lucide-react";
import { joinGroup, leaveGroup } from "@/actions/group.actions";

type MemberState = "none" | "Pending" | "Approved" | "Banned";

export function GroupJoinButton({
	groupId,
	initialState,
	privacy,
	compact = false,
}: {
	groupId: number;
	initialState: MemberState;
	privacy: string;
	compact?: boolean;
}) {
	const [state, setState] = useState<MemberState>(initialState);
	const [isPending, startTransition] = useTransition();

	const handleJoin = () => {
		const isPublic = privacy === "Public";
		setState(isPublic ? "Approved" : "Pending");
		startTransition(() => joinGroup(groupId));
	};

	const handleLeave = () => {
		setState("none");
		startTransition(() => leaveGroup(groupId));
	};

	const base = compact
		? "gap-1.5 font-semibold shrink-0"
		: "w-full mt-3 gap-1.5 font-semibold";

	if (state === "Approved") {
		return (
			<Button
				size="sm"
				variant="secondary"
				className={base}
				onClick={handleLeave}
				disabled={isPending}
			>
				<UserCheck className="h-3.5 w-3.5" />
				{compact ? "Joined" : "Joined"}
			</Button>
		);
	}

	if (state === "Pending") {
		return (
			<Button
				size="sm"
				variant="outline"
				className={base}
				onClick={handleLeave}
				disabled={isPending}
			>
				<Clock className="h-3.5 w-3.5" />
				Requested
			</Button>
		);
	}

	if (state === "Banned") {
		return (
			<Button size="sm" variant="ghost" className={base} disabled>
				<UserX className="h-3.5 w-3.5" />
				Banned
			</Button>
		);
	}

	return (
		<Button
			size="sm"
			variant={compact ? "default" : "secondary"}
			className={base}
			onClick={handleJoin}
			disabled={isPending}
		>
			<UserPlus className="h-3.5 w-3.5" />
			{compact ? "Join group" : "Join group"}
		</Button>
	);
}

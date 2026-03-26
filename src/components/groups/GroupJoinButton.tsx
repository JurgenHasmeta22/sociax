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
}: {
	groupId: number;
	initialState: MemberState;
	privacy: string;
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

	if (state === "Approved") {
		return (
			<Button
				size="sm"
				variant="secondary"
				className="w-full mt-3 gap-1.5 font-semibold"
				onClick={handleLeave}
				disabled={isPending}
			>
				<UserCheck className="h-3.5 w-3.5" />
				Joined
			</Button>
		);
	}

	if (state === "Pending") {
		return (
			<Button
				size="sm"
				variant="outline"
				className="w-full mt-3 gap-1.5 font-semibold"
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
			<Button
				size="sm"
				variant="ghost"
				className="w-full mt-3 gap-1.5 font-semibold"
				disabled
			>
				<UserX className="h-3.5 w-3.5" />
				Banned
			</Button>
		);
	}

	return (
		<Button
			size="sm"
			variant="secondary"
			className="w-full mt-3 gap-1.5 font-semibold"
			onClick={handleJoin}
			disabled={isPending}
		>
			<UserPlus className="h-3.5 w-3.5" />
			Join group
		</Button>
	);
}

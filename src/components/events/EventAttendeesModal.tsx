"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { getEventAttendees } from "@/actions/event.actions";

type AttendeeUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

type AttendeesData = {
	going: AttendeeUser[];
	interested: AttendeeUser[];
	notGoing: AttendeeUser[];
};

const displayName = (u: AttendeeUser) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

type Tab = "going" | "interested" | "notGoing";

function UserList({ users }: { users: AttendeeUser[] }) {
	if (users.length === 0) {
		return (
			<p className="text-sm text-muted-foreground text-center py-6">
				No one yet.
			</p>
		);
	}
	return (
		<div className="space-y-1">
			{users.map((u) => (
				<Link
					key={u.id}
					href={`/profile/${u.userName}`}
					className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
				>
					<Avatar className="h-9 w-9 shrink-0">
						<AvatarImage src={u.avatar?.photoSrc ?? undefined} />
						<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
							{displayName(u)[0]?.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="font-semibold text-sm truncate">
							{displayName(u)}
						</p>
						<p className="text-xs text-muted-foreground truncate">
							@{u.userName}
						</p>
					</div>
				</Link>
			))}
		</div>
	);
}

export function EventAttendeesModal({
	eventId,
	goingCount,
	interestedCount,
	notGoingCount,
}: {
	eventId: number;
	goingCount: number;
	interestedCount: number;
	notGoingCount: number;
}) {
	const [open, setOpen] = useState(false);
	const [data, setData] = useState<AttendeesData | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>("going");
	const [isPending, startTransition] = useTransition();

	const fetchData = () => {
		startTransition(async () => {
			const result = await getEventAttendees(eventId);
			setData(result);
		});
	};

	const handleOpenChange = (isOpen: boolean) => {
		if (isOpen) {
			setOpen(true);
			setData(null);
			fetchData();
		} else {
			setOpen(false);
			setData(null);
		}
	};

	const tabs: { key: Tab; label: string; count: number }[] = [
		{ key: "going", label: "Going", count: data ? data.going.length : goingCount },
		{ key: "interested", label: "Interested", count: data ? data.interested.length : interestedCount },
		{ key: "notGoing", label: "Not going", count: data ? data.notGoing.length : notGoingCount },
	];

	return (
		<>
			<button
				onClick={() => handleOpenChange(true)}
				className="text-sm font-medium hover:underline text-foreground"
			>
				{goingCount} going · {interestedCount} interested
			</button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Attendees</DialogTitle>
					</DialogHeader>

					<div className="flex border-b mb-3">
						{tabs.map((tab) => (
							<button
								key={tab.key}
								onClick={() => setActiveTab(tab.key)}
								className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
									activeTab === tab.key
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground"
								}`}
							>
								{tab.label}
								{tab.count > 0 && (
									<span className="ml-1 text-xs opacity-70">
										({tab.count})
									</span>
								)}
							</button>
						))}
					</div>

					<div className="max-h-[380px] overflow-y-auto">
						{isPending && !data ? (
							<div className="flex justify-center py-8">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : (
							<UserList users={data?.[activeTab] ?? []} />
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

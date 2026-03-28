"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, ChevronRight, CheckCheck, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
	getRecentNotifications,
	markNotificationRead,
	markAllNotificationsRead,
} from "@/actions/notification.actions";

const NOTIFICATION_LABELS: Record<string, string> = {
	follow_request: "sent you a friend request",
	follow_accepted: "accepted your friend request",
	post_liked: "liked your post",
	post_commented: "commented on your post",
	post_shared: "shared your post",
	comment_liked: "liked your comment",
	comment_replied: "replied to your comment",
	story_viewed: "viewed your story",
	story_reacted: "reacted to your story",
	message_received: "sent you a message",
	group_invite: "invited you to a group",
	group_post_liked: "liked your group post",
	group_post_commented: "commented on your group post",
	page_followed: "started following your page",
	event_invite: "invited you to an event",
	event_reminder: "Upcoming event reminder",
	tag_in_post: "mentioned you in a post",
	tag_in_comment: "mentioned you in a comment",
};

type NotificationItem = Awaited<ReturnType<typeof getRecentNotifications>>[number];

export function NotificationBell() {
	const router = useRouter();
	const [count, setCount] = useState(0);
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		const eventSource = new EventSource("/api/notifications/sse");

		eventSource.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data) as { count: number };
				setCount(data.count);
			} catch {
				// ignore parse errors
			}
		};

		eventSource.onerror = () => {
			eventSource.close();
		};

		const handleCountUpdate = (e: Event) => {
			setCount((e as CustomEvent<number>).detail);
		};
		window.addEventListener("notifications:count", handleCountUpdate);

		return () => {
			eventSource.close();
			window.removeEventListener(
				"notifications:count",
				handleCountUpdate,
			);
		};
	}, []);

	const loadNotifications = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getRecentNotifications(8);
			setNotifications(data);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (open) loadNotifications();
	}, [open, loadNotifications]);

	const handleMarkRead = (id: number) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)),
		);
		const newUnread = notifications.filter(
			(n) => n.status === "unread" && n.id !== id,
		).length;
		setCount(newUnread);
		window.dispatchEvent(
			new CustomEvent("notifications:count", { detail: newUnread }),
		);
		startTransition(() => markNotificationRead(id));
	};

	const handleMarkAll = () => {
		startTransition(async () => {
			await markAllNotificationsRead();
			setNotifications((prev) =>
				prev.map((n) => ({ ...n, status: "read" })),
			);
			setCount(0);
			window.dispatchEvent(
				new CustomEvent("notifications:count", { detail: 0 }),
			);
		});
	};

	const unreadInPopover = notifications.filter(
		(n) => n.status === "unread",
	).length;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative rounded-full bg-muted h-9 w-9"
					aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
				>
					<Bell className="h-5 w-5" />
					{count > 0 && (
						<span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
							{count > 99 ? "99+" : count}
						</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				className="w-96 p-0 overflow-hidden"
				sideOffset={8}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b">
					<h3 className="font-bold text-base">Notifications</h3>
					<div className="flex items-center gap-1">
						{unreadInPopover > 0 && (
							<Button
								variant="ghost"
								size="sm"
								className="gap-1 text-xs h-7 px-2"
								onClick={handleMarkAll}
								disabled={isPending}
							>
								<CheckCheck className="h-3.5 w-3.5" />
								Mark all read
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							className="gap-1 text-primary h-7 px-2 text-xs"
							onClick={() => {
								setOpen(false);
								router.push("/notifications");
							}}
						>
							See all
							<ChevronRight className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-10">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : notifications.length === 0 ? (
					<div className="text-center py-10 text-muted-foreground px-4">
						<Bell className="h-9 w-9 mx-auto mb-2 opacity-30" />
						<p className="text-sm font-medium">
							No notifications yet
						</p>
						<p className="text-xs mt-1">
							We&apos;ll notify you when something happens!
						</p>
					</div>
				) : (
					<ScrollArea className="max-h-[420px]">
						<div className="py-1">
							{notifications.map((n) => {
								const actor = n.sender;
								const actorName = actor
									? [actor.firstName, actor.lastName]
											.filter(Boolean)
											.join(" ") || actor.userName
									: "Someone";
								const label =
									NOTIFICATION_LABELS[n.type] ?? n.type;
								const isUnread = n.status === "unread";

								return (
									<div
										key={n.id}
										className={cn(
											"flex items-start gap-3 py-2.5 px-4 hover:bg-muted/50 transition-colors cursor-pointer",
											isUnread && "bg-primary/5",
										)}
										onClick={() => {
											if (isUnread) handleMarkRead(n.id);
										}}
									>
										{actor ? (
											<Avatar className="h-9 w-9 shrink-0">
												<AvatarImage
													src={
														actor.avatar
															?.photoSrc ??
														undefined
													}
												/>
												<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
													{actorName[0]?.toUpperCase()}
												</AvatarFallback>
											</Avatar>
										) : (
											<div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
												<Bell className="h-4 w-4 text-muted-foreground" />
											</div>
										)}
										<div className="flex-1 min-w-0">
											<p className="text-sm leading-snug">
												<span className="font-semibold">
													{actorName}
												</span>{" "}
												{label}
											</p>
											<p className="text-xs text-muted-foreground mt-0.5">
												{formatDistanceToNow(
													new Date(n.createdAt),
													{ addSuffix: true },
												)}
											</p>
										</div>
										{isUnread && (
											<div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
										)}
									</div>
								);
							})}
						</div>
					</ScrollArea>
				)}

				{/* Footer */}
				<div className="border-t px-4 py-2.5">
					<Button
						variant="secondary"
						className="w-full h-8 text-sm gap-2"
						onClick={() => {
							setOpen(false);
							router.push("/notifications");
						}}
					>
						<Bell className="h-4 w-4" />
						View all notifications
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

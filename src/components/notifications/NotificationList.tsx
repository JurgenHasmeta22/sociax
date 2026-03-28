"use client";

import { useState, useTransition, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	markNotificationRead,
	markAllNotificationsRead,
	fetchNotificationsPage,
} from "@/actions/notification.actions";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

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

type NotificationSender = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
} | null;

type NotificationItem = {
	id: number;
	type: string;
	status: string;
	content: string;
	createdAt: Date;
	sender: NotificationSender;
};

function NotificationRow({
	n,
	onRead,
}: {
	n: NotificationItem;
	onRead: (id: number) => void;
}) {
	const [isPending, startTransition] = useTransition();
	const actor = n.sender;
	const actorName = actor
		? [actor.firstName, actor.lastName].filter(Boolean).join(" ") ||
			actor.userName
		: "Someone";
	const label = NOTIFICATION_LABELS[n.type] ?? n.type;
	const timeAgo = formatDistanceToNow(new Date(n.createdAt), {
		addSuffix: true,
	});
	const isUnread = n.status === "unread";

	function handleMarkRead() {
		if (!isUnread) return;
		startTransition(async () => {
			await markNotificationRead(n.id);
			onRead(n.id);
		});
	}

	return (
		<div
			className={cn(
				"group flex items-start gap-3 py-3 px-4 rounded-xl transition-colors",
				isUnread
					? "bg-primary/5 hover:bg-primary/10"
					: "hover:bg-muted/50",
			)}
		>
			{actor ? (
				<Link href={`/profile/${actor.userName}`} className="shrink-0">
					<Avatar className="h-10 w-10">
						<AvatarImage
							src={actor.avatar?.photoSrc ?? undefined}
						/>
						<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
							{actorName[0]?.toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</Link>
			) : (
				<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
					<Bell className="h-5 w-5 text-muted-foreground" />
				</div>
			)}
			<div className="flex-1 min-w-0">
				<p className="text-sm leading-snug">
					{actor ? (
						<Link
							href={`/profile/${actor.userName}`}
							className="font-semibold hover:underline"
						>
							{actorName}
						</Link>
					) : (
						<span className="font-semibold">Sociax</span>
					)}{" "}
					{label}
				</p>
				<p className="text-xs text-muted-foreground mt-0.5">
					{timeAgo}
				</p>
			</div>
			<div className="flex items-center gap-1 shrink-0">
				{isUnread && (
					<>
						<div className="h-2.5 w-2.5 rounded-full bg-primary mt-0.5 group-hover:hidden" />
						<button
							onClick={handleMarkRead}
							disabled={isPending}
							className="hidden group-hover:flex h-7 w-7 rounded-full items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
							title="Mark as read"
						>
							<Check className="h-3.5 w-3.5" />
						</button>
					</>
				)}
			</div>
		</div>
	);
}

export function NotificationList({
	notifications: initialNotifications,
}: {
	notifications: NotificationItem[];
}) {
	const [notifications, setNotifications] =
		useState<NotificationItem[]>(initialNotifications);
	const [isPending, startTransition] = useTransition();
	const [hasMore, setHasMore] = useState(initialNotifications.length >= 40);
	const [loadingMore, setLoadingMore] = useState(false);

	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore) return;
		setLoadingMore(true);
		try {
			const next = await fetchNotificationsPage(notifications.length, 20);
			setNotifications((prev) => [...prev, ...(next as NotificationItem[])]);
			if (next.length < 20) setHasMore(false);
		} catch {
			// ignore
		} finally {
			setLoadingMore(false);
		}
	}, [loadingMore, hasMore, notifications.length]);

	const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading: loadingMore });

	const unreadCount = notifications.filter(
		(n) => n.status === "unread",
	).length;

	function handleRead(id: number) {
		setNotifications((prev) => {
			const next = prev.map((n) =>
				n.id === id ? { ...n, status: "read" } : n,
			);
			const newUnread = next.filter((n) => n.status === "unread").length;
			if (typeof window !== "undefined")
				window.dispatchEvent(
					new CustomEvent("notifications:count", {
						detail: newUnread,
					}),
				);
			return next;
		});
	}

	function handleMarkAll() {
		startTransition(async () => {
			await markAllNotificationsRead();
			setNotifications((prev) =>
				prev.map((n) => ({ ...n, status: "read" })),
			);
			if (typeof window !== "undefined")
				window.dispatchEvent(
					new CustomEvent("notifications:count", { detail: 0 }),
				);
		});
	}

	if (notifications.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
				<p className="font-medium">No notifications yet</p>
				<p className="text-sm mt-1">
					We&apos;ll notify you when something happens!
				</p>
			</div>
		);
	}

	return (
		<div>
			{unreadCount > 0 && (
				<div className="flex items-center justify-between mb-3">
					<p className="text-sm text-muted-foreground">
						{unreadCount} unread
					</p>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
						onClick={handleMarkAll}
						disabled={isPending}
					>
						<CheckCheck className="h-3.5 w-3.5" />
						Mark all as read
					</Button>
				</div>
			)}
			<div className="space-y-0.5">
				{notifications.map((n) => (
					<NotificationRow key={n.id} n={n} onRead={handleRead} />
				))}
			</div>
			{hasMore && (
				<div ref={sentinelRef} className="flex justify-center py-6">
					{loadingMore && (
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					)}
				</div>
			)}
		</div>
	);
}

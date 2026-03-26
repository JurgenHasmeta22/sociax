import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const NOTIFICATION_LABELS: Record<string, string> = {
	NewFollower: "started following you",
	FollowRequest: "sent you a follow request",
	FollowAccepted: "accepted your follow request",
	PostLike: "liked your post",
	PostComment: "commented on your post",
	CommentLike: "liked your comment",
	CommentReply: "replied to your comment",
	PostMention: "mentioned you in a post",
	CommentMention: "mentioned you in a comment",
	GroupInvite: "invited you to a group",
	GroupJoinRequest: "requested to join your group",
	GroupJoinApproved: "approved your group request",
	GroupPostLike: "liked your group post",
	GroupPostComment: "commented on your group post",
	NewMessage: "sent you a message",
	EventInvite: "invited you to an event",
	EventReminder: "Upcoming event reminder",
	SystemAlert: "System notification",
};

type NotificationActor = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
} | null;

type Notification = {
	id: number;
	type: string;
	isRead: boolean;
	createdAt: Date;
	actor: NotificationActor;
};

function NotificationItem({ n }: { n: Notification }) {
	const actor = n.actor;
	const actorName = actor
		? [actor.firstName, actor.lastName].filter(Boolean).join(" ") ||
			actor.userName
		: "Someone";
	const label = NOTIFICATION_LABELS[n.type] ?? n.type;
	const timeAgo = formatDistanceToNow(new Date(n.createdAt), {
		addSuffix: true,
	});

	return (
		<div
			className={cn(
				"flex items-start gap-3 py-3 px-4 rounded-xl transition-colors",
				!n.isRead && "bg-primary/5",
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
			{!n.isRead && (
				<div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
			)}
		</div>
	);
}

export function NotificationList({
	notifications,
}: {
	notifications: Notification[];
}) {
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
		<div className="space-y-0.5">
			{notifications.map((n) => (
				<NotificationItem key={n.id} n={n} />
			))}
		</div>
	);
}

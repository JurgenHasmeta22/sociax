"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUnreadMessageNotifications } from "@/actions/message.actions";

type UnreadMsg = Awaited<
	ReturnType<typeof getUnreadMessageNotifications>
>[number];

function senderName(sender: UnreadMsg["sender"]) {
	return (
		[sender.firstName, sender.lastName].filter(Boolean).join(" ") ||
		sender.userName
	);
}

export function ChatNotificationPoller() {
	const pathname = usePathname();
	const router = useRouter();
	const seenIdsRef = useRef<Set<number>>(new Set());
	const initializedRef = useRef(false);

	const poll = useCallback(async () => {
		// Don't show notifications while on the messages page
		if (pathname.startsWith("/messages")) return;

		try {
			const msgs = await getUnreadMessageNotifications();

			if (!initializedRef.current) {
				// First run: seed the seen set without showing toasts
				msgs.forEach((m) => seenIdsRef.current.add(m.id));
				initializedRef.current = true;
				return;
			}

			const newMsgs = msgs.filter((m) => !seenIdsRef.current.has(m.id));
			newMsgs.forEach((m) => seenIdsRef.current.add(m.id));

			// Group by sender to avoid spam
			const bySender = new Map<number, UnreadMsg[]>();
			for (const m of newMsgs) {
				const arr = bySender.get(m.sender.id) ?? [];
				arr.push(m);
				bySender.set(m.sender.id, arr);
			}

			bySender.forEach((messages, _senderId) => {
				const first = messages[0];
				const name = senderName(first.sender);
				const preview =
					messages.length === 1
						? first.content
							? first.content.length > 60
								? first.content.slice(0, 60) + "…"
								: first.content
							: first.type === "Image"
								? "📷 Photo"
								: "📎 File"
						: `${messages.length} new messages`;

				toast(name, {
					description: preview ?? undefined,
					icon: (
						<Avatar className="h-8 w-8 shrink-0">
							<AvatarImage
								src={first.sender.avatar?.photoSrc ?? undefined}
							/>
							<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
								{name[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					),
					action: {
						label: "Open",
						onClick: () =>
							router.push(
								`/messages?conv=${first.conversationId}`,
							),
					},
					duration: 6000,
				});
			});
		} catch {
			// silently ignore
		}
	}, [pathname, router]);

	useEffect(() => {
		// Reset when page changes so we re-seed the seen set on next poll
		if (pathname.startsWith("/messages")) {
			initializedRef.current = false;
			seenIdsRef.current.clear();
		}
	}, [pathname]);

	useEffect(() => {
		poll();
		const interval = setInterval(poll, 15000);
		return () => clearInterval(interval);
	}, [poll]);

	return null;
}

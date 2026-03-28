"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	getChatNavData,
	getOrCreateConversation,
	getUnreadConversations,
} from "@/actions/message.actions";

type NavData = Awaited<ReturnType<typeof getChatNavData>>;
type Friend = NavData["onlineFriends"][number];
type UnreadConv = Awaited<ReturnType<typeof getUnreadConversations>>[number];

function friendName(f: { firstName: string | null; lastName: string | null; userName: string }) {
	return [f.firstName, f.lastName].filter(Boolean).join(" ") || f.userName;
}

function senderName(sender: { firstName: string | null; lastName: string | null; userName: string }) {
	return [sender.firstName, sender.lastName].filter(Boolean).join(" ") || sender.userName;
}

function FriendRow({
	friend,
	onOpen,
}: {
	friend: Friend;
	onOpen: (id: number) => void;
}) {
	const [pending, startTransition] = useTransition();
	const name = friendName(friend);

	return (
		<button
			className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
			onClick={() => startTransition(() => onOpen(friend.id))}
			disabled={pending}
		>
			<div className="relative shrink-0">
				<Avatar className="h-9 w-9">
					<AvatarImage src={friend.avatar?.photoSrc ?? undefined} />
					<AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
						{name[0]?.toUpperCase()}
					</AvatarFallback>
				</Avatar>
				{friend.isOnline && (
					<span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium truncate">{name}</p>
				<p className="text-xs text-muted-foreground">
					{friend.isOnline ? (
						<span className="text-green-500 font-medium">
							Active now
						</span>
					) : (
						"Offline"
					)}
				</p>
			</div>
			{pending ? (
				<Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
			) : (
				<MessageCircle className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
			)}
		</button>
	);
}

export function ChatNavButton() {
	const router = useRouter();
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [data, setData] = useState<NavData>({
		unreadCount: 0,
		onlineFriends: [],
	});
	const [unreadConvs, setUnreadConvs] = useState<UnreadConv[]>([]);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		try {
			const [next, unreads] = await Promise.all([
				getChatNavData(),
				getUnreadConversations(6),
			]);
			setData(next);
			setUnreadConvs(unreads);
		} catch {
			// ignore
		}
	}, []);

	// Poll every 10s, and immediately when popover opens
	useEffect(() => {
		refresh();
		const t = setInterval(refresh, 10000);
		return () => clearInterval(t);
	}, [refresh]);

	// Reset unread count immediately when user navigates to /messages
	useEffect(() => {
		if (pathname.startsWith("/messages")) {
			// Give messages page time to mark as read, then refresh
			const t = setTimeout(refresh, 2000);
			return () => clearTimeout(t);
		}
	}, [pathname, refresh]);

	const openChatWithFriend = useCallback(
		async (friendId: number) => {
			setOpen(false);
			setLoading(true);
			try {
				const conv = await getOrCreateConversation(friendId);
				router.push(`/messages?conv=${conv.id}`);
			} catch {
				// ignore
			} finally {
				setLoading(false);
			}
		},
		[router],
	);

	const onlineFriends = data.onlineFriends.filter((f) => f.isOnline);
	const offlineFriends = data.onlineFriends.filter((f) => !f.isOnline);
	const unread = data.unreadCount;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full bg-muted h-9 w-9 relative"
					aria-label={`Messages${unread > 0 ? `, ${unread} unread` : ""}`}
				>
					<MessageCircle className="h-5 w-5" />
					{unread > 0 && (
						<span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 leading-none">
							{unread > 99 ? "99+" : unread}
						</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				className="w-80 p-0 overflow-hidden"
				sideOffset={8}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b">
					<h3 className="font-bold text-base">Chats</h3>
					<Button
						variant="ghost"
						size="sm"
						className="gap-1 text-primary h-7 px-2 text-xs"
						onClick={() => {
							setOpen(false);
							router.push("/messages");
						}}
					>
						See all
						<ChevronRight className="h-3.5 w-3.5" />
					</Button>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-10">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : data.onlineFriends.length === 0 && unreadConvs.length === 0 ? (
					<div className="text-center py-10 text-muted-foreground px-4">
						<MessageCircle className="h-9 w-9 mx-auto mb-2 opacity-30" />
						<p className="text-sm font-medium">No friends yet</p>
						<p className="text-xs mt-1">
							Add friends to start chatting
						</p>
					</div>
				) : (
					<ScrollArea className="max-h-[420px]">
						<div className="py-2">
							{/* Unread messages */}
							{unreadConvs.length > 0 && (
								<>
									<p className="px-4 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
										Unread Messages — {unreadConvs.length}
									</p>
									{unreadConvs.map((conv) => {
										const msg = conv.lastMessage!;
										const name = senderName(msg.sender);
										const preview =
											msg.type === "Text"
												? msg.content?.slice(0, 50) +
													(msg.content && msg.content.length > 50
														? "…"
														: "")
												: msg.type === "Image"
													? "📷 Photo"
													: "📎 File";

										return (
											<button
												key={conv.conversationId}
												className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left bg-primary/5"
												onClick={() => {
													setOpen(false);
													router.push(
														`/messages?conv=${conv.conversationId}`,
													);
												}}
											>
												<div className="relative shrink-0">
													<Avatar className="h-9 w-9">
														<AvatarImage
															src={
																msg.sender.avatar
																	?.photoSrc ??
																undefined
															}
														/>
														<AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
															{name[0]?.toUpperCase()}
														</AvatarFallback>
													</Avatar>
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-semibold truncate">
														{name}
													</p>
													<p className="text-xs text-muted-foreground truncate">
														{preview}
													</p>
												</div>
												<div className="flex flex-col items-end gap-0.5 shrink-0">
													<span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 leading-none">
														{conv.unreadCount}
													</span>
													<span className="text-[10px] text-muted-foreground">
														{formatDistanceToNow(
															new Date(msg.createdAt),
															{ addSuffix: true },
														).replace("about ", "")}
													</span>
												</div>
											</button>
										);
									})}
								</>
							)}

							{/* Online friends */}
							{onlineFriends.length > 0 && (
								<>
									<p
										className={cn(
											"px-4 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide",
											unreadConvs.length > 0 && "mt-2",
										)}
									>
										Active now — {onlineFriends.length}
									</p>
									{onlineFriends.map((f) => (
										<FriendRow
											key={f.id}
											friend={f}
											onOpen={openChatWithFriend}
										/>
									))}
								</>
							)}

							{offlineFriends.length > 0 && (
								<>
									<p
										className={cn(
											"px-4 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide",
											(onlineFriends.length > 0 || unreadConvs.length > 0) && "mt-2",
										)}
									>
										Friends
									</p>
									{offlineFriends.map((f) => (
										<FriendRow
											key={f.id}
											friend={f}
											onOpen={openChatWithFriend}
										/>
									))}
								</>
							)}
						</div>
					</ScrollArea>
				)}

				{/* Footer: open full chat */}
				<div className="border-t px-4 py-2.5">
					<Button
						variant="secondary"
						className="w-full h-8 text-sm gap-2"
						onClick={() => {
							setOpen(false);
							router.push("/messages");
						}}
					>
						<MessageCircle className="h-4 w-4" />
						Open Messenger
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

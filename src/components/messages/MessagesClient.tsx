"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	Search,
	Send,
	Paperclip,
	Phone,
	Video,
	Info,
	ArrowLeft,
	FileText,
	Image as ImageIcon,
	Smile,
	Check,
	CheckCheck,
	X,
	MessageCircle,
	MoreHorizontal,
	Pencil,
	Trash2,
	Trash,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import {
	getMyConversations,
	getConversationMessages,
	getOrCreateConversation,
	sendMessage,
	pollNewMessages,
	markConversationRead,
	searchChatUsers,
	pingOnline,
	editMessage,
	deleteMessageForMe,
	deleteMessageForAll,
} from "@/actions/message.actions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Conversation = Awaited<ReturnType<typeof getMyConversations>>[number];
type Message = Awaited<ReturnType<typeof getConversationMessages>>[number];
type SearchUser = Awaited<ReturnType<typeof searchChatUsers>>[number];

function timeLabel(date: Date) {
	const d = new Date(date);
	if (isToday(d)) return format(d, "HH:mm");
	if (isYesterday(d)) return "Yesterday";
	return format(d, "dd MMM");
}

function dateSeparatorLabel(date: Date) {
	const d = new Date(date);
	if (isToday(d)) return "Today";
	if (isYesterday(d)) return "Yesterday";
	return format(d, "MMMM d, yyyy");
}

function needsDateSeparator(prev: Message | undefined, curr: Message) {
	if (!prev) return true;
	const a = new Date(prev.createdAt);
	const b = new Date(curr.createdAt);
	return a.toDateString() !== b.toDateString();
}

function MessageStatusIcon({
	status,
	isMine,
}: {
	status: string;
	isMine: boolean;
}) {
	if (!isMine) return null;
	if (status === "Read")
		return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
	if (status === "Delivered")
		return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
	return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
}

function MessageBubble({
	msg,
	isMine,
	onEdit,
	onDeleteMe,
	onDeleteAll,
}: {
	msg: Message;
	isMine: boolean;
	onEdit?: (msg: Message) => void;
	onDeleteMe?: (id: number) => void;
	onDeleteAll?: (id: number) => void;
}) {
	const isImage = msg.type === "Image";
	const isFile = msg.type === "File";
	const hasText = msg.content && msg.content.trim().length > 0;
	const isPdf =
		isFile &&
		(msg.mediaUrl?.toLowerCase().endsWith(".pdf") ||
			msg.mediaUrl?.includes("/pdf"));

	return (
		<div
			className={cn(
				"group flex gap-2 items-end",
				isMine ? "flex-row-reverse" : "flex-row",
			)}
		>
			{!isMine && (
				<Avatar className="h-7 w-7 shrink-0 mb-1">
					<AvatarImage
						src={msg.sender.avatar?.photoSrc ?? undefined}
					/>
					<AvatarFallback className="text-xs bg-primary text-primary-foreground">
						{(
							msg.sender.firstName?.[0] ?? msg.sender.userName[0]
						).toUpperCase()}
					</AvatarFallback>
				</Avatar>
			)}
			<div
				className={cn(
					"max-w-[65%] flex flex-col gap-0.5",
					isMine ? "items-end" : "items-start",
				)}
			>
				{isImage && msg.mediaUrl && (
					<a
						href={msg.mediaUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={msg.mediaUrl}
							alt="image"
							className="rounded-xl max-h-60 object-cover border border-border/40 cursor-pointer hover:opacity-90 transition-opacity"
						/>
					</a>
				)}
				{isFile && msg.mediaUrl && (
					<a
						href={msg.mediaUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(
							"flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:opacity-80 transition-opacity",
							isMine
								? "bg-primary text-primary-foreground border-primary/20"
								: "bg-muted text-foreground border-border/60",
						)}
					>
						{isPdf ? (
							<span className="text-lg leading-none">📄</span>
						) : (
							<FileText className="h-4 w-4 shrink-0" />
						)}
						<span className="truncate max-w-[200px]">
							{msg.mediaUrl.split("/").pop()}
						</span>
					</a>
				)}
				{hasText && (
					<div
						className={cn(
							"px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
							isMine
								? "bg-primary text-primary-foreground rounded-br-sm"
								: "bg-muted text-foreground rounded-bl-sm",
						)}
					>
						{msg.content}
					</div>
				)}
				<div
					className={cn(
						"flex items-center gap-1 px-1",
						isMine ? "flex-row-reverse" : "flex-row",
					)}
				>
					<span className="text-[10px] text-muted-foreground">
						{format(new Date(msg.createdAt), "HH:mm")}
						{msg.isEdited && (
							<span className="ml-1 opacity-60">(edited)</span>
						)}
					</span>
					<MessageStatusIcon status={msg.status} isMine={isMine} />
				</div>
			</div>
			{/* Context menu — visible on hover */}
			{(isMine || onDeleteMe) && (
				<div
					className={cn(
						"self-center opacity-0 group-hover:opacity-100 transition-opacity",
						isMine ? "mr-1" : "ml-1",
					)}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
								<MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align={isMine ? "end" : "start"}
							className="w-44"
						>
							{isMine && msg.type === "Text" && onEdit && (
								<DropdownMenuItem
									onClick={() => onEdit(msg)}
									className="gap-2"
								>
									<Pencil className="h-3.5 w-3.5" /> Edit
									message
								</DropdownMenuItem>
							)}
							{isMine && (
								<DropdownMenuItem
									onClick={() => onDeleteAll?.(msg.id)}
									className="gap-2 text-destructive focus:text-destructive"
								>
									<Trash2 className="h-3.5 w-3.5" /> Delete
									for all
								</DropdownMenuItem>
							)}
							{onDeleteMe && (
								<>
									{isMine && <DropdownMenuSeparator />}
									<DropdownMenuItem
										onClick={() => onDeleteMe(msg.id)}
										className="gap-2 text-destructive focus:text-destructive"
									>
										<Trash className="h-3.5 w-3.5" /> Delete
										for me
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</div>
	);
}

interface MessagesClientProps {
	initialConversations: Conversation[];
	currentUserId: number;
}

export function MessagesClient({
	initialConversations,
	currentUserId,
}: MessagesClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const convIdParam = searchParams.get("conv");

	const [conversations, setConversations] =
		useState<Conversation[]>(initialConversations);
	const [activeConvId, setActiveConvId] = useState<number | null>(
		convIdParam ? parseInt(convIdParam) : null,
	);
	const [messages, setMessages] = useState<Message[]>([]);
	const [messageText, setMessageText] = useState("");
	const [userSearch, setUserSearch] = useState("");
	const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadPreview, setUploadPreview] = useState<{
		url: string;
		name: string;
		type: string;
	} | null>(null);
	const [showMobileList, setShowMobileList] = useState(true);
	// Edit state
	const [editingMsg, setEditingMsg] = useState<Message | null>(null);
	const [editText, setEditText] = useState("");

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const lastMsgIdRef = useRef<number>(0);
	const activeConvIdRef = useRef<number | null>(null);

	// Sync ref with state for use in intervals
	useEffect(() => {
		activeConvIdRef.current = activeConvId;
	}, [activeConvId]);

	const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;

	// Ping online on mount + every 60s
	useEffect(() => {
		pingOnline().catch(() => {});
		const t = setInterval(() => pingOnline().catch(() => {}), 60000);
		return () => clearInterval(t);
	}, []);

	// Load initial conversation from URL param
	useEffect(() => {
		if (convIdParam) {
			const id = parseInt(convIdParam);
			setActiveConvId(id);
			setShowMobileList(false);
			loadMessages(id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Refresh conversation list every 5s
	useEffect(() => {
		const t = setInterval(async () => {
			try {
				const convs = await getMyConversations();
				setConversations(convs);
			} catch {
				// silently ignore
			}
		}, 5000);
		return () => clearInterval(t);
	}, []);

	// Poll new messages every 2s when a conversation is open
	useEffect(() => {
		if (!activeConvId) return;
		const t = setInterval(async () => {
			const cid = activeConvIdRef.current;
			if (!cid) return;
			try {
				const newMsgs = await pollNewMessages(
					cid,
					lastMsgIdRef.current,
				);
				if (newMsgs.length > 0) {
					setMessages((prev) => {
						const existingIds = new Set(prev.map((m) => m.id));
						const unique = newMsgs.filter(
							(m) => !existingIds.has(m.id),
						);
						if (unique.length === 0) return prev;
						const updated = [...prev, ...unique];
						lastMsgIdRef.current = updated[updated.length - 1].id;
						return updated;
					});
				}
			} catch {
				// silently ignore
			}
		}, 2000);
		return () => clearInterval(t);
	}, [activeConvId]);

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Search users with debounce
	useEffect(() => {
		if (!userSearch.trim()) {
			setSearchResults([]);
			return;
		}
		const t = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await searchChatUsers(userSearch);
				setSearchResults(results);
			} catch {
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300);
		return () => clearTimeout(t);
	}, [userSearch]);

	const loadMessages = useCallback(async (convId: number) => {
		try {
			const msgs = await getConversationMessages(convId);
			setMessages(msgs);
			if (msgs.length > 0) {
				lastMsgIdRef.current = msgs[msgs.length - 1].id;
			} else {
				lastMsgIdRef.current = 0;
			}
			await markConversationRead(convId).catch(() => {});
		} catch {
			setMessages([]);
		}
	}, []);

	const selectConversation = useCallback(
		async (convId: number) => {
			setActiveConvId(convId);
			setShowMobileList(false);
			router.replace(`/messages?conv=${convId}`, { scroll: false });
			await loadMessages(convId);
		},
		[router, loadMessages],
	);

	const openConversationWithUser = useCallback(
		async (user: SearchUser) => {
			setUserSearch("");
			setSearchResults([]);
			try {
				const conv = await getOrCreateConversation(user.id);
				// Add to conversations list if not present
				setConversations((prev) => {
					if (prev.find((c) => c.id === conv.id)) return prev;
					return [
						{
							id: conv.id,
							isGroup: conv.isGroup,
							name: conv.name,
							coverUrl: conv.coverUrl,
							otherUserId: conv.otherUserId,
							otherUserName: conv.otherUserName,
							isOnline: conv.isOnline,
							lastActiveAt: conv.lastActiveAt,
							lastMessage:
								null as unknown as Conversation["lastMessage"],
							updatedAt: new Date(),
						},
						...prev,
					];
				});
				await selectConversation(conv.id);
			} catch {
				toast.error("Could not open conversation");
			}
		},
		[selectConversation],
	);

	const handleFileSelect = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			setIsUploading(true);
			try {
				const fd = new FormData();
				fd.append("file", file);
				const res = await fetch("/api/upload/chat", {
					method: "POST",
					body: fd,
				});
				if (!res.ok) {
					const err = await res.json();
					toast.error(err.error ?? "Upload failed");
					return;
				}
				const data = await res.json();
				setUploadPreview({
					url: data.url,
					name: data.name ?? file.name,
					type: file.type,
				});
			} catch {
				toast.error("Upload failed");
			} finally {
				setIsUploading(false);
				if (fileInputRef.current) fileInputRef.current.value = "";
			}
		},
		[],
	);

	const handleEditStart = useCallback((msg: Message) => {
		setEditingMsg(msg);
		setEditText(msg.content ?? "");
	}, []);

	const handleEditSave = useCallback(async () => {
		if (!editingMsg || !editText.trim()) return;
		try {
			const updated = await editMessage(editingMsg.id, editText.trim());
			setMessages((prev) =>
				prev.map((m) =>
					m.id === updated.id
						? { ...m, content: updated.content, isEdited: true }
						: m,
				),
			);
			setEditingMsg(null);
			setEditText("");
		} catch {
			toast.error("Failed to edit message");
		}
	}, [editingMsg, editText]);

	const handleDeleteMe = useCallback(async (messageId: number) => {
		try {
			await deleteMessageForMe(messageId);
			setMessages((prev) => prev.filter((m) => m.id !== messageId));
		} catch {
			toast.error("Failed to delete message");
		}
	}, []);

	const handleDeleteAll = useCallback(async (messageId: number) => {
		try {
			await deleteMessageForAll(messageId);
			setMessages((prev) => prev.filter((m) => m.id !== messageId));
		} catch {
			toast.error("Failed to delete message");
		}
	}, []);

	const handleSend = useCallback(async () => {
		if (!activeConvId) return;
		const text = messageText.trim();
		if (!text && !uploadPreview) return;

		setIsSending(true);
		try {
			let msgType: "Text" | "Image" | "File" = "Text";
			if (uploadPreview) {
				msgType = uploadPreview.type.startsWith("image/")
					? "Image"
					: "File";
			}

			const sent = await sendMessage(
				activeConvId,
				text || null,
				uploadPreview?.url ?? null,
				msgType,
			);

			setMessages((prev) => {
				const exists = prev.find((m) => m.id === sent.id);
				if (exists) return prev;
				return [...prev, sent];
			});
			lastMsgIdRef.current = sent.id;
			setMessageText("");
			setUploadPreview(null);

			// Update last message in conversation list
			setConversations((prev) =>
				prev.map((c) =>
					c.id === activeConvId
						? {
								...c,
								lastMessage: { ...sent, sender: sent.sender },
								updatedAt: new Date(),
							}
						: c,
				),
			);
		} catch {
			toast.error("Failed to send message");
		} finally {
			setIsSending(false);
		}
	}, [activeConvId, messageText, uploadPreview]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const EMOJIS = [
		"😊",
		"😂",
		"❤️",
		"👍",
		"🔥",
		"😍",
		"🙏",
		"😭",
		"✨",
		"🎉",
		"😎",
		"🤔",
		"👀",
		"😢",
		"💯",
	];
	const [showEmojis, setShowEmojis] = useState(false);

	return (
		<div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background">
			{/* Left Panel — Conversation List */}
			<div
				className={cn(
					"w-full md:w-[340px] shrink-0 border-r border-border/60 flex flex-col",
					activeConvId ? "hidden md:flex" : "flex",
					!showMobileList && "hidden md:flex",
				)}
			>
				{/* Header */}
				<div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
					<h1 className="font-bold text-xl">Chats</h1>
				</div>

				{/* Search */}
				<div className="px-3 py-2 border-b border-border/60">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						<input
							type="text"
							placeholder="Search or start new chat..."
							value={userSearch}
							onChange={(e) => setUserSearch(e.target.value)}
							className="w-full pl-9 pr-3 py-2 rounded-full bg-muted text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
						/>
						{userSearch && (
							<button
								onClick={() => {
									setUserSearch("");
									setSearchResults([]);
								}}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						)}
					</div>

					{/* Search Results Dropdown */}
					{(searchResults.length > 0 || isSearching) && (
						<div className="mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10">
							{isSearching ? (
								<p className="text-sm text-muted-foreground text-center py-3">
									Searching...
								</p>
							) : (
								searchResults.map((u) => (
									<button
										key={u.id}
										onClick={() =>
											openConversationWithUser(u)
										}
										className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/80 transition-colors text-left"
									>
										<div className="relative shrink-0">
											<Avatar className="h-9 w-9">
												<AvatarImage
													src={
														u.avatar?.photoSrc ??
														undefined
													}
												/>
												<AvatarFallback className="bg-primary text-primary-foreground text-xs">
													{(
														u.firstName?.[0] ??
														u.userName[0]
													).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											{u.isOnline && (
												<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
											)}
										</div>
										<div className="min-w-0">
											<p className="text-sm font-semibold truncate">
												{u.firstName && u.lastName
													? `${u.firstName} ${u.lastName}`
													: u.userName}
											</p>
											<p className="text-xs text-muted-foreground">
												@{u.userName}
											</p>
										</div>
									</button>
								))
							)}
						</div>
					)}
				</div>

				{/* Conversation List */}
				<div className="flex-1 overflow-y-auto">
					{conversations.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6 text-center">
							<MessageCircle className="h-12 w-12 opacity-30" />
							<p className="font-medium">No conversations yet</p>
							<p className="text-sm">
								Search for people above to start chatting
							</p>
						</div>
					) : (
						conversations.map((conv) => {
							const lastMsg = conv.lastMessage;
							const preview = lastMsg
								? lastMsg.type !== "Text"
									? lastMsg.type === "Image"
										? "📷 Photo"
										: "📄 File"
									: (lastMsg.content ?? "").slice(0, 40)
								: "Start a conversation";
							const isActive = conv.id === activeConvId;

							return (
								<button
									key={conv.id}
									onClick={() => selectConversation(conv.id)}
									className={cn(
										"w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left",
										isActive &&
											"bg-primary/10 hover:bg-primary/10",
									)}
								>
									<div className="relative shrink-0">
										<Avatar className="h-12 w-12">
											<AvatarImage
												src={conv.coverUrl ?? undefined}
											/>
											<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
												{(conv.name ??
													"?")[0].toUpperCase()}
											</AvatarFallback>
										</Avatar>
										{conv.isOnline && (
											<span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-baseline justify-between gap-2">
											<p className="font-semibold text-sm truncate">
												{conv.name}
											</p>
											{lastMsg && (
												<span className="text-[11px] text-muted-foreground shrink-0">
													{timeLabel(
														lastMsg.createdAt,
													)}
												</span>
											)}
										</div>
										<p className="text-xs text-muted-foreground truncate mt-0.5">
											{preview}
										</p>
									</div>
								</button>
							);
						})
					)}
				</div>
			</div>

			{/* Right Panel — Chat Window */}
			<div
				className={cn(
					"flex-1 flex flex-col min-w-0",
					!activeConvId && "hidden md:flex",
					showMobileList && "hidden md:flex",
				)}
			>
				{!activeConvId ? (
					<div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
						<div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
							<MessageCircle className="h-10 w-10 opacity-40" />
						</div>
						<div className="text-center">
							<p className="font-semibold text-lg">
								Your Messages
							</p>
							<p className="text-sm mt-1">
								Select a conversation or search for someone to
								chat with
							</p>
						</div>
					</div>
				) : (
					<>
						{/* Chat Header */}
						<div className="px-4 py-3 border-b border-border/60 flex items-center gap-3 bg-background shrink-0">
							<button
								className="md:hidden text-muted-foreground hover:text-foreground p-1"
								onClick={() => {
									setShowMobileList(true);
									setActiveConvId(null);
								}}
							>
								<ArrowLeft className="h-5 w-5" />
							</button>
							<div className="relative shrink-0">
								<Avatar className="h-10 w-10">
									<AvatarImage
										src={activeConv?.coverUrl ?? undefined}
									/>
									<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
										{(activeConv?.name ??
											"?")[0].toUpperCase()}
									</AvatarFallback>
								</Avatar>
								{activeConv?.isOnline && (
									<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="font-semibold text-sm truncate">
									{activeConv?.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{activeConv?.isOnline
										? "Online"
										: activeConv?.lastActiveAt
											? `Active ${formatDistanceToNow(new Date(activeConv.lastActiveAt), { addSuffix: true })}`
											: "Offline"}
								</p>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
								>
									<Phone className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
								>
									<Video className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
								>
									<Info className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
							{messages.length === 0 && (
								<div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
									<Avatar className="h-16 w-16">
										<AvatarImage
											src={
												activeConv?.coverUrl ??
												undefined
											}
										/>
										<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
											{(activeConv?.name ??
												"?")[0].toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<p className="font-medium">
										{activeConv?.name}
									</p>
									<p className="text-sm">Say hello! 👋</p>
								</div>
							)}

							{messages.map((msg, idx) => {
								const prev = messages[idx - 1];
								const showSep = needsDateSeparator(prev, msg);
								const isMine = msg.senderId === currentUserId;
								return (
									<div key={msg.id}>
										{showSep && (
											<div className="flex items-center gap-3 my-4">
												<div className="flex-1 h-px bg-border/60" />
												<span className="text-xs text-muted-foreground font-medium px-2">
													{dateSeparatorLabel(
														msg.createdAt,
													)}
												</span>
												<div className="flex-1 h-px bg-border/60" />
											</div>
										)}
										<MessageBubble
											msg={msg}
											isMine={isMine}
											onEdit={handleEditStart}
											onDeleteMe={handleDeleteMe}
											onDeleteAll={handleDeleteAll}
										/>
									</div>
								);
							})}
							<div ref={messagesEndRef} />
						</div>

						{/* Edit Bar */}
						{editingMsg && (
							<div className="px-4 py-2 border-t border-border/40 bg-muted/30 flex items-center gap-2">
								<Pencil className="h-4 w-4 text-primary shrink-0" />
								<span className="text-xs text-muted-foreground flex-1 truncate">
									Editing: {editingMsg.content}
								</span>
								<button
									onClick={() => {
										setEditingMsg(null);
										setEditText("");
									}}
									className="text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						)}
						{/* Upload Preview */}
						{uploadPreview && (
							<div className="px-4 py-2 border-t border-border/40 bg-muted/30">
								<div className="flex items-center gap-2 bg-background rounded-lg p-2.5 border border-border/60 max-w-xs">
									{uploadPreview.type.startsWith("image/") ? (
										<>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={uploadPreview.url}
												alt="preview"
												className="h-12 w-12 object-cover rounded-md"
											/>
											<ImageIcon className="h-4 w-4 text-muted-foreground" />
										</>
									) : (
										<FileText className="h-8 w-8 text-primary shrink-0" />
									)}
									<span className="text-xs truncate flex-1">
										{uploadPreview.name}
									</span>
									<button
										onClick={() => setUploadPreview(null)}
										className="text-muted-foreground hover:text-foreground shrink-0"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}

						{/* Emoji Picker */}
						{showEmojis && (
							<div className="px-4 py-2 border-t border-border/40 bg-muted/20">
								<div className="flex flex-wrap gap-1.5">
									{EMOJIS.map((emoji) => (
										<button
											key={emoji}
											onClick={() => {
												setMessageText(
													(prev) => prev + emoji,
												);
												setShowEmojis(false);
											}}
											className="text-xl hover:scale-125 transition-transform leading-none"
										>
											{emoji}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Composer */}
						<div className="px-4 py-3 border-t border-border/60 bg-background shrink-0">
							<div className="flex items-end gap-2">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
									className="hidden"
									onChange={handleFileSelect}
								/>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
									onClick={() =>
										fileInputRef.current?.click()
									}
									disabled={isUploading}
								>
									{isUploading ? (
										<span className="text-xs">...</span>
									) : (
										<Paperclip className="h-4.5 w-4.5" />
									)}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"h-9 w-9 shrink-0",
										showEmojis
											? "text-primary"
											: "text-muted-foreground hover:text-foreground",
									)}
									onClick={() => setShowEmojis((v) => !v)}
								>
									<Smile className="h-4.5 w-4.5" />
								</Button>
								<Textarea
									value={editingMsg ? editText : messageText}
									onChange={(e) =>
										editingMsg
											? setEditText(e.target.value)
											: setMessageText(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											editingMsg
												? handleEditSave()
												: handleSend();
										}
										if (e.key === "Escape" && editingMsg) {
											setEditingMsg(null);
											setEditText("");
										}
									}}
									placeholder={
										editingMsg
											? "Edit message..."
											: "Type a message..."
									}
									rows={1}
									className="flex-1 resize-none min-h-[38px] max-h-28 py-2 text-sm leading-relaxed rounded-2xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
								/>
								<Button
									size="icon"
									className="h-9 w-9 shrink-0 rounded-full"
									onClick={
										editingMsg ? handleEditSave : handleSend
									}
									disabled={
										isSending ||
										(editingMsg
											? !editText.trim()
											: !messageText.trim() &&
												!uploadPreview)
									}
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	MapPin,
	Link as LinkIcon,
	CalendarDays,
	UserPlus,
	UserMinus,
	Clock,
	MessageCircle,
	MoreHorizontal,
	Users,
	Lock,
	Globe,
	BookOpen,
	CalendarCheck,
	Flag,
	CheckCircle2,
	Camera,
	GraduationCap,
	Briefcase,
	Heart,
	Radio,
	Search,
	Pencil,
	ShieldAlert,
	OctagonX,
	Trash2,
	Video,
	ShoppingBag,
	Bookmark,
	NotebookPen,
	SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import {
	sendFollowRequest,
	cancelFollowRequest,
	unfollowUser,
} from "@/actions/follow.actions";
import {
	updateAvatar,
	updateCoverPhoto,
	blockUser,
	unblockUser,
	reportUser,
} from "@/actions/user.actions";
import { getOrCreateConversation } from "@/actions/message.actions";
import { deletePage } from "@/actions/page.actions";
import { deleteGroup } from "@/actions/group.actions";
import { deleteEvent } from "@/actions/event.actions";
import { deleteAlbum, deleteStandalonePhoto } from "@/actions/album.actions";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CreateAlbumDialog } from "@/components/profile/CreateAlbumDialog";
import { AddPhotoDialog } from "@/components/profile/AddPhotoDialog";
import { AlbumView } from "@/components/profile/AlbumView";
import { MemoriesClient } from "@/components/profile/MemoriesClient";
import { SavedPostsClient } from "@/components/feed/SavedPostsClient";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CreateStoryDialog } from "@/components/feed/CreateStoryDialog";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type FriendUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
	_count: { following: number };
};

type Post = {
	id: number;
	content: string | null;
	createdAt: Date;
	privacy: string;
	saves?: { id: number }[];
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	media: { id: number; url: string; type: string; order: number }[];
	likes: { id: number; userId: number; reactionType: string }[];
	_count: { comments: number; shares: number };
	hashtags: { hashtag: { id: number; name: string } }[];
};

type GroupItem = {
	id: number;
	name: string;
	slug: string;
	coverUrl: string | null;
	avatarUrl: string | null;
	privacy: string;
	_count: { members: number };
	isOwned?: boolean;
};

type PageItem = {
	id: number;
	name: string;
	slug: string;
	coverUrl: string | null;
	avatarUrl: string | null;
	category: string;
	isVerified: boolean;
	_count: { followers: number };
	isOwned?: boolean;
};

type EventItem = {
	id: number;
	title: string;
	slug: string;
	coverUrl: string | null;
	startDate: Date;
	location: string | null;
	isOnline: boolean;
	privacy: string;
	_count: { attendees: number };
	isOwned?: boolean;
};

type BlogItem = {
	id: number;
	slug: string;
	title: string;
	excerpt: string | null;
	coverImageUrl: string | null;
	published: boolean;
	createdAt: Date;
	hashtags: { hashtag: { id: number; name: string } }[];
	_count: { likes: number };
};

type AlbumItem = {
	id: number;
	name: string;
	description: string | null;
	coverUrl: string | null;
	privacy: string;
	createdAt: Date;
	_count: { photos: number };
	photos: { photoUrl: string }[];
};

type MemoryItem = {
	id: number;
	note: string | null;
	createdAt: Date;
	post: Post | null;
};

type MarketListing = {
	id: number;
	title: string;
	slug: string;
	price: number;
	isFree: boolean;
	status: string;
	category: string;
	condition: string;
	location: string | null;
	createdAt: Date;
	images: { url: string }[];
	_count: { saves: number };
};

type ProfileUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	bio: string | null;
	location: string | null;
	website: string | null;
	birthday: Date | null;
	gender: string;
	profilePrivacy: string;
	avatar: { photoSrc: string } | null;
	coverPhoto: { photoSrc: string } | null;
	_count: { followers: number; following: number; posts: number };
	posts: Post[];
};

const TABS = [
	"Timeline",
	"Friends",
	"Photos",
	"Videos",
	"Groups",
	"Blogs",
	"Memories",
	"Saved",
	"Market",
	"More",
] as const;
type Tab = (typeof TABS)[number];

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

function PrivacyGate({ privacy }: { privacy: string }) {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
			<Lock className="h-12 w-12 mb-4 opacity-30" />
			<p className="font-semibold text-base">This content is private</p>
			<p className="text-sm mt-1 max-w-xs">
				{privacy === "Private"
					? "This user has set their profile to private."
					: "Add this person as a friend to see their content."}
			</p>
		</div>
	);
}

function FriendGrid({ people }: { people: FriendUser[] }) {
	if (people.length === 0) {
		return (
			<div className="text-center py-16 text-muted-foreground">
				<Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
				<p className="font-medium">No friends to show</p>
			</div>
		);
	}
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
			{people.map((person) => {
				const n = displayName(person);
				return (
					<Link
						key={person.id}
						href={`/profile/${person.userName}`}
						className="group block"
					>
						<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
							<div className="relative h-24 bg-muted">
								<Avatar className="w-full h-full rounded-none">
									<AvatarImage
										src={
											person.avatar?.photoSrc ?? undefined
										}
										className="object-cover"
									/>
									<AvatarFallback className="rounded-none text-2xl bg-primary text-primary-foreground h-full w-full">
										{n[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</div>
							<CardContent className="p-2.5">
								<p className="font-semibold text-sm leading-tight truncate group-hover:underline">
									{n}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{person._count.following} friends
								</p>
							</CardContent>
						</Card>
					</Link>
				);
			})}
		</div>
	);
}

function GroupGrid({
	groups,
	emptyLabel,
}: {
	groups: GroupItem[];
	emptyLabel: string;
}) {
	if (groups.length === 0) {
		return (
			<div className="text-center py-10 text-muted-foreground">
				<Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
				<p className="text-sm font-medium">{emptyLabel}</p>
			</div>
		);
	}
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{groups.map((g) => (
				<Link
					key={g.id}
					href={`/groups/${g.slug}`}
					className="group block"
				>
					<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
						<div className="relative h-28 bg-muted">
							{g.coverUrl ? (
								<Image
									src={g.coverUrl}
									alt={g.name}
									fill
									className="object-cover"
									sizes="400px"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
									<Users className="h-10 w-10 text-primary/30" />
								</div>
							)}
							<div className="absolute top-2 right-2 flex gap-1">
								{g.isOwned && (
									<Badge className="text-[10px] bg-primary text-primary-foreground gap-1">
										Admin
									</Badge>
								)}
								<Badge
									variant="secondary"
									className="text-[10px] bg-background/90 backdrop-blur gap-1"
								>
									{g.privacy === "Public" ? (
										<Globe className="h-3 w-3" />
									) : (
										<Lock className="h-3 w-3" />
									)}
									{g.privacy}
								</Badge>
							</div>
						</div>
						<CardContent className="p-3">
							<p className="font-semibold text-sm truncate group-hover:underline">
								{g.name}
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{g._count.members.toLocaleString()} members
							</p>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

function PageGrid({
	pages,
	emptyLabel,
}: {
	pages: PageItem[];
	emptyLabel: string;
}) {
	if (pages.length === 0) {
		return (
			<div className="text-center py-10 text-muted-foreground">
				<Flag className="h-8 w-8 mx-auto mb-2 opacity-30" />
				<p className="text-sm font-medium">{emptyLabel}</p>
			</div>
		);
	}
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{pages.map((p) => (
				<Link
					key={p.id}
					href={`/pages/${p.slug}`}
					className="group block"
				>
					<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
						<div className="relative h-24 bg-muted">
							{p.coverUrl ? (
								<Image
									src={p.coverUrl}
									alt={p.name}
									fill
									className="object-cover"
									sizes="400px"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
									<Flag className="h-8 w-8 text-primary/30" />
								</div>
							)}
							{p.isOwned && (
								<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">
									Admin
								</Badge>
							)}
						</div>
						<CardContent className="p-3">
							<div className="flex items-center gap-1.5">
								<p className="font-semibold text-sm truncate group-hover:underline flex-1">
									{p.name}
								</p>
								{p.isVerified && (
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
								)}
							</div>
							<div className="flex items-center justify-between mt-0.5">
								<p className="text-xs text-muted-foreground">
									{p.category}
								</p>
								<p className="text-xs text-muted-foreground">
									{p._count.followers.toLocaleString()}{" "}
									followers
								</p>
							</div>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

function EventGrid({
	events,
	emptyLabel,
}: {
	events: EventItem[];
	emptyLabel: string;
}) {
	if (events.length === 0) {
		return (
			<div className="text-center py-10 text-muted-foreground">
				<CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
				<p className="text-sm font-medium">{emptyLabel}</p>
			</div>
		);
	}
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{events.map((e) => (
				<Link
					key={e.id}
					href={`/events/${e.slug}`}
					className="group block"
				>
					<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
						<div className="relative h-28 bg-muted">
							{e.coverUrl ? (
								<Image
									src={e.coverUrl}
									alt={e.title}
									fill
									className="object-cover"
									sizes="500px"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
									<CalendarCheck className="h-10 w-10 text-primary/30" />
								</div>
							)}
							{e.isOwned && (
								<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">
									Organizer
								</Badge>
							)}
						</div>
						<CardContent className="p-3">
							<p className="font-semibold text-sm truncate group-hover:underline">
								{e.title}
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{format(new Date(e.startDate), "MMM d, yyyy")}
								{e.isOnline
									? " · Online"
									: e.location
										? ` · ${e.location}`
										: ""}
							</p>
							<p className="text-xs text-muted-foreground">
								{e._count.attendees} attending
							</p>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

export function ProfileContent({
	user,
	isOwnProfile,
	currentUserId,
	followState: initialFollowState,
	canViewContent,
	friends,
	groups,
	ownedGroups,
	followedPages,
	ownedPages,
	createdEvents,
	attendingEvents,
	blogs = [],
	albums = [],
	initialMemories = [],
	initialSavedPosts = [],
	marketListings = [],
	initialIsBlocked = false,
}: {
	user: ProfileUser;
	isOwnProfile: boolean;
	currentUserId: number | null;
	followState: "none" | "outgoing_pending" | "accepted" | null;
	canViewContent: boolean;
	friends: FriendUser[];
	groups: GroupItem[];
	ownedGroups: GroupItem[];
	followedPages: PageItem[];
	ownedPages: PageItem[];
	createdEvents: EventItem[];
	attendingEvents: EventItem[];
	blogs?: BlogItem[];
	albums?: AlbumItem[];
	initialMemories?: MemoryItem[];
	initialSavedPosts?: Post[];
	marketListings?: MarketListing[];
	initialIsBlocked?: boolean;
}) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<Tab>("Timeline");
	const [followState, setFollowState] = useState(initialFollowState);
	const [isPending, startTransition] = useTransition();
	const [isMessaging, setIsMessaging] = useState(false);
	const [avatarSrc, setAvatarSrc] = useState(user.avatar?.photoSrc ?? null);
	const [coverSrc, setCoverSrc] = useState(user.coverPhoto?.photoSrc ?? null);
	const [posts, setPosts] = useState<Post[]>(user.posts);
	const avatarInputRef = useRef<HTMLInputElement>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);
	const name = displayName(user);
	const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
	const [blockPending, setBlockPending] = useState(false);
	const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
	const [reportOpen, setReportOpen] = useState(false);
	const [reportReason, setReportReason] = useState("");
	const [reportPending, setReportPending] = useState(false);
	const [ownedPagesList, setOwnedPagesList] =
		useState<PageItem[]>(ownedPages);
	const [ownedGroupsList, setOwnedGroupsList] =
		useState<GroupItem[]>(ownedGroups);
	const [createdEventsList, setCreatedEventsList] =
		useState<EventItem[]>(createdEvents);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		type: "page" | "group" | "event";
		id: number;
		name: string;
	} | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
	const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
	const [addPhotoOpen, setAddPhotoOpen] = useState(false);
	const [albumsList, setAlbumsList] = useState<AlbumItem[]>(albums);
	const [standalonePhotos, setStandalonePhotos] = useState<
		{ id: number; url: string }[]
	>([]);
	const [createStoryOpen, setCreateStoryOpen] = useState(false);
	const [photoConfirm, setPhotoConfirm] = useState<{
		action: () => Promise<void>;
		title: string;
		description: string;
	} | null>(null);
	const [pagesSubTab, setPagesSubTab] = useState<"mine" | "following">(
		"mine",
	);
	const [eventsSubTab, setEventsSubTab] = useState<"mine" | "attending">(
		"mine",
	);
	const [groupsSubTab, setGroupsSubTab] = useState<"mine" | "joined">("mine");

	// Sort states for tabs
	const [postSort, setPostSort] = useState<
		"newest" | "oldest" | "most_liked" | "most_commented"
	>("newest");
	const [blogSort, setBlogSort] = useState<
		"newest" | "oldest" | "most_liked"
	>("newest");
	const [blogPublishFilter, setBlogPublishFilter] = useState<
		"all" | "published" | "drafts"
	>("all");
	const [photoSort, setPhotoSort] = useState<"newest" | "oldest">("newest");
	const [videoSort, setVideoSort] = useState<"newest" | "oldest">("newest");
	const [marketSort, setMarketSort] = useState<
		"newest" | "oldest" | "price_asc" | "price_desc"
	>("newest");
	const [marketStatusFilter, setMarketStatusFilter] = useState<
		"all" | "Active" | "Sold"
	>("all");
	const [friendSearch, setFriendSearch] = useState("");
	const [groupSort, setGroupSort] = useState<
		"default" | "most_members" | "alphabetical"
	>("default");

	const handleBlock = async () => {
		setBlockPending(true);
		try {
			if (isBlocked) {
				await unblockUser(user.id);
				setIsBlocked(false);
				toast.success(`Unblocked ${name}`);
			} else {
				await blockUser(user.id);
				setIsBlocked(true);
				setFollowState("none");
				toast.success(`Blocked ${name}`);
			}
		} catch {
			toast.error("Action failed. Try again.");
		} finally {
			setBlockPending(false);
			setConfirmBlockOpen(false);
		}
	};

	const handleReport = async () => {
		if (!reportReason.trim()) {
			toast.warning("Please enter a reason.");
			return;
		}
		setReportPending(true);
		try {
			await reportUser(user.id, reportReason.trim());
			toast.success("Report submitted. We'll review it shortly.");
			setReportOpen(false);
			setReportReason("");
		} catch {
			toast.error("Failed to submit report.");
		} finally {
			setReportPending(false);
		}
	};

	const handleDeleteOwned = async () => {
		if (!deleteConfirm) return;
		setDeletingId(deleteConfirm.id);
		try {
			if (deleteConfirm.type === "page") {
				await deletePage(deleteConfirm.id);
				setOwnedPagesList((prev) =>
					prev.filter((p) => p.id !== deleteConfirm.id),
				);
				toast.success("Page deleted.");
			} else if (deleteConfirm.type === "group") {
				await deleteGroup(deleteConfirm.id);
				setOwnedGroupsList((prev) =>
					prev.filter((g) => g.id !== deleteConfirm.id),
				);
				toast.success("Group deleted.");
			} else if (deleteConfirm.type === "event") {
				await deleteEvent(deleteConfirm.id);
				setCreatedEventsList((prev) =>
					prev.filter((e) => e.id !== deleteConfirm.id),
				);
				toast.success("Event deleted.");
			}
		} catch {
			toast.error("Failed to delete. Try again.");
		} finally {
			setDeletingId(null);
			setDeleteConfirm(null);
		}
	};

	const handleMessage = useCallback(async () => {
		if (!currentUserId) return;
		setIsMessaging(true);
		try {
			const conv = await getOrCreateConversation(user.id);
			router.push(`/messages?conv=${conv.id}`);
		} catch {
			toast.error("Could not open conversation");
		} finally {
			setIsMessaging(false);
		}
	}, [currentUserId, user.id, router]);

	const handleFollow = () => {
		if (!currentUserId) return;
		if (followState === "none") {
			setFollowState("outgoing_pending");
			startTransition(() => sendFollowRequest(user.id));
		} else if (followState === "outgoing_pending") {
			setFollowState("none");
			startTransition(() => cancelFollowRequest(user.id));
		} else if (followState === "accepted") {
			setFollowState("none");
			startTransition(() => unfollowUser(user.id));
		}
	};

	const handleAvatarChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const preview = URL.createObjectURL(file);
		setAvatarSrc(preview);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/upload", {
				method: "POST",
				body: fd,
			});
			if (!res.ok) throw new Error();
			const { url } = await res.json();
			setAvatarSrc(url);
			await updateAvatar(url);
			toast.success("Profile picture updated");
		} catch {
			toast.error("Failed to update profile picture");
		}
	};

	const handleCoverChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const preview = URL.createObjectURL(file);
		setCoverSrc(preview);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/upload", {
				method: "POST",
				body: fd,
			});
			if (!res.ok) throw new Error();
			const { url } = await res.json();
			setCoverSrc(url);
			await updateCoverPhoto(url);
			toast.success("Cover photo updated");
		} catch {
			toast.error("Failed to update cover photo");
		}
	};

	const allGroups = [
		...ownedGroupsList.map((g) => ({ ...g, isOwned: true })),
		...groups
			.filter((g) => !ownedGroupsList.find((og) => og.id === g.id))
			.map((g) => ({ ...g, isOwned: false })),
	];
	const allPages = [
		...ownedPagesList.map((p) => ({ ...p, isOwned: true })),
		...followedPages
			.filter((p) => !ownedPagesList.find((op) => op.id === p.id))
			.map((p) => ({ ...p, isOwned: false })),
	];

	// Sorted posts
	const sortedPosts = [...posts].sort((a, b) => {
		if (postSort === "oldest")
			return (
				new Date(a.createdAt).getTime() -
				new Date(b.createdAt).getTime()
			);
		if (postSort === "most_liked") return b.likes.length - a.likes.length;
		if (postSort === "most_commented")
			return b._count.comments - a._count.comments;
		return (
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});

	// Sorted + filtered blogs
	const filteredBlogs = blogs.filter((b) => {
		if (!isOwnProfile) return b.published;
		if (blogPublishFilter === "published") return b.published;
		if (blogPublishFilter === "drafts") return !b.published;
		return true;
	});
	const sortedBlogs = [...filteredBlogs].sort((a, b) => {
		if (blogSort === "oldest")
			return (
				new Date(a.createdAt).getTime() -
				new Date(b.createdAt).getTime()
			);
		if (blogSort === "most_liked") return b._count.likes - a._count.likes;
		return (
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});

	// Sorted + filtered market listings
	const filteredMarket = marketListings.filter((m) =>
		marketStatusFilter === "all" ? true : m.status === marketStatusFilter,
	);
	const sortedMarket = [...filteredMarket].sort((a, b) => {
		if (marketSort === "oldest")
			return (
				new Date(a.createdAt).getTime() -
				new Date(b.createdAt).getTime()
			);
		if (marketSort === "price_asc") return a.price - b.price;
		if (marketSort === "price_desc") return b.price - a.price;
		return (
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});

	// Filtered friends
	const filteredFriends = friendSearch.trim()
		? friends.filter(
				(f) =>
					displayName(f)
						.toLowerCase()
						.includes(friendSearch.toLowerCase()) ||
					f.userName
						.toLowerCase()
						.includes(friendSearch.toLowerCase()),
			)
		: friends;

	// Sorted groups
	const sortedAllGroups = [...allGroups].sort((a, b) => {
		if (groupSort === "most_members")
			return b._count.members - a._count.members;
		if (groupSort === "alphabetical") return a.name.localeCompare(b.name);
		return 0;
	});

	return (
		<div className="pb-10">
			{/* Cover photo */}
			<div className="relative bg-muted h-56 md:h-72 overflow-hidden group">
				{coverSrc ? (
					<Image
						src={coverSrc}
						alt="Cover"
						fill
						className="object-cover"
						sizes="100vw"
						priority
						unoptimized
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5" />
				)}
				{isOwnProfile && (
					<>
						<input
							ref={coverInputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleCoverChange}
						/>
						<div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button
								size="sm"
								variant="secondary"
								className="gap-1.5 bg-background/80 backdrop-blur"
								onClick={() => coverInputRef.current?.click()}
							>
								<Camera className="h-3.5 w-3.5" />
								Edit cover
							</Button>
						</div>
					</>
				)}
			</div>

			{/* Avatar + name row */}
			<div className="max-w-5xl mx-auto px-4">
				<div className="flex flex-col items-center -mt-16 relative z-10 mb-4">
					{/* Avatar */}
					<div className="relative group">
						<div className="w-36 h-36 rounded-full ring-4 ring-background shadow-xl overflow-hidden bg-muted">
							{avatarSrc ? (
								<Image
									src={avatarSrc}
									alt={name}
									fill
									className="object-cover"
									sizes="144px"
									unoptimized
								/>
							) : (
								<div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-5xl font-bold">
									{name[0]?.toUpperCase()}
								</div>
							)}
						</div>
						{isOwnProfile && (
							<>
								<input
									ref={avatarInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleAvatarChange}
								/>
								<button
									onClick={() =>
										avatarInputRef.current?.click()
									}
									className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-muted border-2 border-background flex items-center justify-center hover:bg-accent transition-colors"
								>
									<Camera className="h-4 w-4" />
								</button>
							</>
						)}
					</div>

					{/* Name + bio */}
					<div className="text-center mt-3">
						<h1 className="text-2xl font-bold">{name}</h1>
						{user.bio && (
							<p className="text-muted-foreground text-sm mt-1 max-w-md leading-relaxed">
								{user.bio}
							</p>
						)}
						<div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
							<button
								onClick={() => setActiveTab("Friends")}
								className="hover:underline"
							>
								<span className="font-semibold text-foreground">
									{user._count.followers.toLocaleString()}
								</span>{" "}
								friends
							</button>
							<span>
								<span className="font-semibold text-foreground">
									{user._count.following.toLocaleString()}
								</span>{" "}
								following
							</span>
						</div>
					</div>

					{/* Action buttons */}
					<div className="flex items-center gap-2 mt-4">
						{isOwnProfile ? (
							<>
								<Button className="gap-2 font-semibold" asChild>
									<Link href="/settings">
										<Pencil className="h-4 w-4" />
										Edit profile
									</Link>
								</Button>
							</>
						) : (
							<>
								<Button
									onClick={handleFollow}
									disabled={isPending || !currentUserId}
									className="gap-2 font-semibold"
									variant={
										followState === "accepted"
											? "secondary"
											: "default"
									}
								>
									{followState === "accepted" ? (
										<>
											<UserMinus className="h-4 w-4" />
											Friends
										</>
									) : followState === "outgoing_pending" ? (
										<>
											<Clock className="h-4 w-4" />
											Request Sent
										</>
									) : (
										<>
											<UserPlus className="h-4 w-4" />
											Add Friend
										</>
									)}
								</Button>
								<Button
									variant="secondary"
									className="gap-2 font-semibold"
									onClick={handleMessage}
									disabled={isMessaging || !currentUserId}
								>
									<MessageCircle className="h-4 w-4" />
									{isMessaging ? "Opening..." : "Message"}
								</Button>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="secondary" size="icon">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												setConfirmBlockOpen(true)
											}
											disabled={
												blockPending || !currentUserId
											}
											className={
												isBlocked
													? "text-green-600"
													: "text-destructive"
											}
										>
											<OctagonX className="h-4 w-4 mr-2" />
											{isBlocked
												? `Unblock ${name}`
												: `Block ${name}`}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => setReportOpen(true)}
											disabled={!currentUserId}
										>
											<ShieldAlert className="h-4 w-4 mr-2" />
											Report
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						)}
					</div>
				</div>

				<Separator />

				{/* Profile tabs */}
				<div className="flex items-center justify-between mt-1">
					<div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
						{TABS.filter((tab) => {
							if (tab === "Memories" || tab === "Saved")
								return isOwnProfile;
							return true;
						}).map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-md transition-colors ${
									activeTab === tab
										? "text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								}`}
							>
								{tab === "Friends"
									? `Friends ${user._count.followers > 0 ? user._count.followers.toLocaleString() : ""}`
									: tab}
								{activeTab === tab && (
									<span className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
								)}
							</button>
						))}
					</div>
					<div className="flex items-center gap-2 shrink-0 pb-1">
						{isOwnProfile && (
							<Button
								variant="default"
								size="sm"
								className="gap-2"
								onClick={() => setCreateStoryOpen(true)}
							>
								<Camera className="h-4 w-4" />
								Add Story
							</Button>
						)}
					</div>
				</div>
				<Separator className="mb-6" />

				{/* Tab content */}
				{activeTab === "Timeline" && (
					<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
						{/* Left: Intro + friends preview */}
						<div className="space-y-4">
							<Card>
								<CardContent className="pt-4 pb-4">
									<div className="flex items-center justify-between mb-3">
										<h3 className="font-semibold">Intro</h3>
										{isOwnProfile && (
											<Button
												variant="ghost"
												size="sm"
												asChild
											>
												<Link href="/settings">
													<Pencil className="h-3.5 w-3.5 mr-1" />
													Edit
												</Link>
											</Button>
										)}
									</div>
									{user.bio && (
										<p className="text-sm text-muted-foreground mb-3 leading-relaxed text-center">
											{user.bio}
										</p>
									)}
									<div className="space-y-2.5 text-sm">
										{user.location && (
											<p className="flex items-center gap-2 text-muted-foreground">
												<MapPin className="h-4 w-4 shrink-0 text-primary" />
												Live In{" "}
												<span className="font-semibold text-foreground">
													{user.location}
												</span>
											</p>
										)}
										{user.website && (
											<p className="flex items-center gap-2 text-muted-foreground">
												<GraduationCap className="h-4 w-4 shrink-0 text-primary" />
												Studied at{" "}
												<a
													href={user.website}
													target="_blank"
													rel="noopener noreferrer"
													className="font-semibold text-foreground hover:underline truncate"
												>
													{user.website.replace(
														/^https?:\/\//,
														"",
													)}
												</a>
											</p>
										)}
										{user.website && (
											<p className="flex items-center gap-2 text-muted-foreground">
												<Briefcase className="h-4 w-4 shrink-0 text-primary" />
												Works at{" "}
												<span className="font-semibold text-foreground">
													Envato Market
												</span>
											</p>
										)}
										<p className="flex items-center gap-2 text-muted-foreground">
											<Heart className="h-4 w-4 shrink-0 text-primary" />
											In{" "}
											<span className="font-semibold text-foreground">
												Relationship
											</span>
										</p>
										<p className="flex items-center gap-2 text-muted-foreground">
											<Radio className="h-4 w-4 shrink-0 text-primary" />
											Followed By{" "}
											<span className="font-semibold text-foreground">
												{user._count.followers.toLocaleString()}{" "}
												People
											</span>
										</p>
										{user.birthday && (
											<p className="flex items-center gap-2 text-muted-foreground">
												<CalendarDays className="h-4 w-4 shrink-0 text-primary" />
												Born{" "}
												<span className="font-semibold text-foreground">
													{format(
														new Date(user.birthday),
														"MMMM d, yyyy",
													)}
												</span>
											</p>
										)}
									</div>
									{/* Interest tags */}
									<div className="flex flex-wrap gap-2 mt-3">
										{[
											"Shopping",
											"Code",
											"Art",
											"Design",
										].map((tag) => (
											<Badge
												key={tag}
												variant="secondary"
												className="rounded-full text-xs"
											>
												{tag}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>

							{canViewContent && friends.length > 0 && (
								<Card>
									<CardContent className="pt-4 pb-4">
										<div className="flex items-center justify-between mb-3">
											<h3 className="font-semibold">
												Friends
											</h3>
											<button
												onClick={() =>
													setActiveTab("Friends")
												}
												className="text-primary text-xs hover:underline"
											>
												See all
											</button>
										</div>
										<p className="text-xs text-muted-foreground mb-3">
											{user._count.followers.toLocaleString()}{" "}
											friends
										</p>
										<div className="grid grid-cols-3 gap-2">
											{friends.slice(0, 9).map((f) => {
												const n = displayName(f);
												return (
													<Link
														key={f.id}
														href={`/profile/${f.userName}`}
														className="group"
													>
														<div className="aspect-square rounded-lg overflow-hidden bg-muted">
															<Avatar className="h-full w-full rounded-none">
																<AvatarImage
																	src={
																		f.avatar
																			?.photoSrc ??
																		undefined
																	}
																	className="object-cover"
																/>
																<AvatarFallback className="rounded-none bg-primary text-primary-foreground font-semibold">
																	{n[0]?.toUpperCase()}
																</AvatarFallback>
															</Avatar>
														</div>
														<p className="text-xs mt-1 font-medium truncate group-hover:underline">
															{n.split(" ")[0]}
														</p>
													</Link>
												);
											})}
										</div>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Right: Post composer + posts */}
						<div className="space-y-4">
							{isOwnProfile && currentUserId && (
								<PostComposer
									user={{
										userName: user.userName,
										firstName: user.firstName,
										lastName: user.lastName,
										avatar: user.avatar,
									}}
								/>
							)}
							{!canViewContent ? (
								<PrivacyGate privacy={user.profilePrivacy} />
							) : posts.length === 0 ? (
								<div className="text-center py-20 text-muted-foreground">
									<BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
									<p className="font-medium">No posts yet</p>
								</div>
							) : (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<p className="text-sm text-muted-foreground">
											{posts.length} posts
										</p>
										<Select
											value={postSort}
											onValueChange={(v) =>
												setPostSort(
													v as typeof postSort,
												)
											}
										>
											<SelectTrigger className="w-48 h-8 text-xs">
												<SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="newest">
													Newest first
												</SelectItem>
												<SelectItem value="oldest">
													Oldest first
												</SelectItem>
												<SelectItem value="most_liked">
													Most liked
												</SelectItem>
												<SelectItem value="most_commented">
													Most commented
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{sortedPosts.map((post) => (
										<PostCard
											key={post.id}
											post={post}
											currentUserId={currentUserId ?? 0}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{activeTab === "Friends" && (
					<div className="pb-10">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : (
							<>
								<div className="flex items-center justify-between gap-3 mb-4">
									<div className="relative flex-1 max-w-sm">
										<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Search friends…"
											value={friendSearch}
											onChange={(e) =>
												setFriendSearch(e.target.value)
											}
											className="pl-9 h-9 text-sm"
										/>
									</div>
									<p className="text-sm text-muted-foreground shrink-0">
										{filteredFriends.length} /{" "}
										{user._count.followers.toLocaleString()}{" "}
										friends
									</p>
								</div>
								<FriendGrid people={filteredFriends} />
							</>
						)}
					</div>
				)}

				{(activeTab === "Photos" || activeTab === "Videos") && (
					<div className="pb-10">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : activeTab === "Videos" ? (
							<>
								<div className="flex items-center justify-between mb-4">
									<Select
										value={videoSort}
										onValueChange={(v) =>
											setVideoSort(v as typeof videoSort)
										}
									>
										<SelectTrigger className="w-40 h-8 text-xs">
											<SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="newest">
												Newest first
											</SelectItem>
											<SelectItem value="oldest">
												Oldest first
											</SelectItem>
										</SelectContent>
									</Select>
									{isOwnProfile && (
										<Button
											size="sm"
											className="gap-2"
											asChild
										>
											<Link href="/videos">
												<Video className="h-4 w-4" />
												Upload Video
											</Link>
										</Button>
									)}
								</div>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
									{[...posts]
										.sort((a, b) =>
											videoSort === "oldest"
												? new Date(
														a.createdAt,
													).getTime() -
													new Date(
														b.createdAt,
													).getTime()
												: new Date(
														b.createdAt,
													).getTime() -
													new Date(
														a.createdAt,
													).getTime(),
										)
										.flatMap((p) => p.media)
										.filter((m) => m.type === "video")
										.map((m) => (
											<div
												key={m.id}
												className="aspect-square rounded-lg overflow-hidden bg-muted"
											>
												<video
													src={m.url}
													className="w-full h-full object-cover"
												/>
											</div>
										))}
									{posts
										.flatMap((p) => p.media)
										.filter((m) => m.type === "video")
										.length === 0 && (
										<div className="col-span-4 text-center py-16 text-muted-foreground">
											<p className="font-medium">
												No videos yet
											</p>
										</div>
									)}
								</div>
								<div className="flex justify-center mt-4">
									<Button variant="outline" size="sm" asChild>
										<Link href="/videos">
											Browse all videos
										</Link>
									</Button>
								</div>
							</>
						) : selectedAlbumId !== null ? (
							(() => {
								const selAlbum = albumsList.find(
									(a) => a.id === selectedAlbumId,
								);
								if (!selAlbum) return null;
								return (
									<AlbumView
										albumId={selAlbum.id}
										albumMeta={{
											name: selAlbum.name,
											description: selAlbum.description,
											privacy: selAlbum.privacy,
											isOwner: isOwnProfile,
										}}
										allAlbums={albumsList.map((a) => ({
											id: a.id,
											name: a.name,
										}))}
										onBack={() => setSelectedAlbumId(null)}
										onPhotosChanged={(
											aid,
											count,
											firstPhotoUrl,
										) => {
											setAlbumsList((prev) =>
												prev.map((a) =>
													a.id === aid
														? {
																...a,
																_count: {
																	photos: count,
																},
																photos: firstPhotoUrl
																	? [
																			{
																				photoUrl:
																					firstPhotoUrl,
																			},
																		]
																	: [],
															}
														: a,
												),
											);
										}}
										onAlbumDeleted={(aid) => {
											setAlbumsList((prev) =>
												prev.filter(
													(a) => a.id !== aid,
												),
											);
											setSelectedAlbumId(null);
										}}
									/>
								);
							})()
						) : (
							<div className="space-y-6">
								{/* Sort + Albums section */}
								<div className="flex items-center justify-between">
									<Select
										value={photoSort}
										onValueChange={(v) =>
											setPhotoSort(v as typeof photoSort)
										}
									>
										<SelectTrigger className="w-40 h-8 text-xs">
											<SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="newest">
												Newest first
											</SelectItem>
											<SelectItem value="oldest">
												Oldest first
											</SelectItem>
										</SelectContent>
									</Select>
									{isOwnProfile && (
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												className="gap-1.5"
												onClick={() =>
													setAddPhotoOpen(true)
												}
											>
												+ Add Photo
											</Button>
											<Button
												size="sm"
												className="gap-1.5"
												onClick={() =>
													setCreateAlbumOpen(true)
												}
											>
												+ Create Album
											</Button>
										</div>
									)}
								</div>
								<div>
									<h3 className="font-semibold text-base mb-3">
										Albums
									</h3>
									{albumsList.length === 0 ? (
										<div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
											<p className="font-medium">
												No albums yet
											</p>
											{isOwnProfile && (
												<p className="text-sm mt-1">
													Create an album to organise
													your photos
												</p>
											)}
										</div>
									) : (
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
											{albumsList.map((album) => (
												<div
													key={album.id}
													className="relative group"
												>
													<button
														onClick={() =>
															setSelectedAlbumId(
																album.id,
															)
														}
														className="text-left w-full"
													>
														<div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
															{album.photos[0] ? (
																<img
																	src={
																		album
																			.photos[0]
																			.photoUrl
																	}
																	alt={
																		album.name
																	}
																	className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
																/>
															) : (
																<div className="w-full h-full flex items-center justify-center">
																	<Camera className="h-10 w-10 text-muted-foreground/30" />
																</div>
															)}
															<div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1.5">
																<p className="text-white text-xs font-medium truncate">
																	{album.name}
																</p>
																<p className="text-white/70 text-[10px]">
																	{
																		album
																			._count
																			.photos
																	}{" "}
																	photo
																	{album
																		._count
																		.photos !==
																	1
																		? "s"
																		: ""}
																</p>
															</div>
														</div>
													</button>
													{isOwnProfile && (
														<button
															onClick={(e) => {
																e.stopPropagation();
																setPhotoConfirm(
																	{
																		title: `Delete album "${album.name}"?`,
																		description:
																			"This will permanently delete the album and all its photos.",
																		action: async () => {
																			await deleteAlbum(
																				album.id,
																			);
																			setAlbumsList(
																				(
																					prev,
																				) =>
																					prev.filter(
																						(
																							a,
																						) =>
																							a.id !==
																							album.id,
																					),
																			);
																			toast.success(
																				"Album deleted",
																			);
																		},
																	},
																);
															}}
															className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
														>
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													)}
												</div>
											))}
										</div>
									)}
								</div>

								{/* Individual photos */}
								<div>
									<h3 className="font-semibold text-base mb-3">
										Photos
									</h3>
									{(() => {
										const postPhotos = posts.flatMap((p) =>
											p.media
												.filter(
													(m) => m.type === "image",
												)
												.map((m) => ({
													id: m.id,
													url: m.url,
													postId: p.id,
												})),
										);
										const standaloneIds = new Set(
											standalonePhotos.map((sp) => sp.id),
										);
										const allPhotos: {
											id: number;
											url: string;
											postId?: number;
											isStandalone: boolean;
										}[] = [
											...standalonePhotos.map((sp) => ({
												...sp,
												postId: sp.id,
												isStandalone: true,
											})),
											...postPhotos
												.filter(
													(p) =>
														!standaloneIds.has(
															p.id,
														),
												)
												.map((p) => ({
													...p,
													isStandalone: false,
												})),
										];
										if (allPhotos.length === 0) {
											return (
												<div className="col-span-4 text-center py-10 text-muted-foreground border border-dashed rounded-lg">
													<p className="text-sm">
														No individual photos yet
													</p>
													{isOwnProfile && (
														<p className="text-sm mt-1">
															Use &ldquo;Add
															Photo&rdquo; to
															upload photos here
														</p>
													)}
												</div>
											);
										}
										return (
											<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
												{allPhotos.map((photo) => (
													<div
														key={`${photo.isStandalone ? "s" : "p"}-${photo.id}`}
														className="aspect-square rounded-lg overflow-hidden bg-muted relative group"
													>
														<img
															src={photo.url}
															alt=""
															className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
														/>
														{isOwnProfile && (
															<button
																onClick={() => {
																	setPhotoConfirm(
																		{
																			title: "Delete this photo?",
																			description:
																				"This photo will be permanently removed and cannot be recovered.",
																			action: async () => {
																				if (
																					photo.isStandalone
																				) {
																					await deleteStandalonePhoto(
																						photo.postId!,
																					);
																					setStandalonePhotos(
																						(
																							prev,
																						) =>
																							prev.filter(
																								(
																									sp,
																								) =>
																									sp.id !==
																									photo.id,
																							),
																					);
																				} else {
																					await deleteStandalonePhoto(
																						photo.postId!,
																					);
																					setPosts(
																						(
																							prev,
																						) =>
																							prev.filter(
																								(
																									p,
																								) =>
																									p.id !==
																									photo.postId,
																							),
																					);
																				}
																				toast.success(
																					"Photo deleted",
																				);
																			},
																		},
																	);
																}}
																className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
															>
																<Trash2 className="h-3.5 w-3.5" />
															</button>
														)}
													</div>
												))}
											</div>
										);
									})()}
								</div>

								{/* Dialogs */}
								<CreateAlbumDialog
									open={createAlbumOpen}
									onClose={() => setCreateAlbumOpen(false)}
									onCreated={(newAlbum) => {
										setAlbumsList((prev) => [
											...prev,
											{
												...newAlbum,
												_count: { photos: 0 },
												photos: [],
											},
										]);
										setCreateAlbumOpen(false);
									}}
								/>
								<AddPhotoDialog
									open={addPhotoOpen}
									onClose={() => setAddPhotoOpen(false)}
									albums={albumsList.map((a) => ({
										id: a.id,
										name: a.name,
									}))}
									onAdded={(photo) => {
										setAddPhotoOpen(false);
										if (!photo) return;
										if (photo.albumId) {
											setAlbumsList((prev) =>
												prev.map((a) =>
													a.id === photo.albumId
														? {
																...a,
																_count: {
																	photos:
																		a._count
																			.photos +
																		1,
																},
																photos:
																	a.photos
																		.length ===
																	0
																		? [
																				{
																					photoUrl:
																						photo.photoUrl,
																				},
																			]
																		: a.photos,
															}
														: a,
												),
											);
										} else {
											// Added without an album – show in Individual Photos
											setStandalonePhotos((prev) => [
												{
													id: photo.id,
													url: photo.photoUrl,
												},
												...prev,
											]);
										}
									}}
								/>
								<ConfirmDeleteDialog
									open={!!photoConfirm}
									onClose={() => setPhotoConfirm(null)}
									onConfirm={
										photoConfirm?.action ?? (() => {})
									}
									title={photoConfirm?.title ?? ""}
									description={
										photoConfirm?.description ?? ""
									}
								/>
							</div>
						)}
					</div>
				)}

				{activeTab === "Groups" && (
					<div className="pb-10 space-y-4">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : (
							<>
								<div className="flex items-center justify-between gap-3 flex-wrap">
									<div className="flex items-center gap-2">
										<h2 className="font-semibold text-base">
											Groups
										</h2>
										{(ownedGroups.length > 0 ||
											groups.length > 0) && (
											<div className="flex rounded-lg border overflow-hidden text-sm">
												<button
													onClick={() =>
														setGroupsSubTab("mine")
													}
													className={`px-3 py-1 font-medium transition-colors ${groupsSubTab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													{isOwnProfile
														? "My Groups"
														: "Created"}
												</button>
												<button
													onClick={() =>
														setGroupsSubTab(
															"joined",
														)
													}
													className={`px-3 py-1 font-medium transition-colors ${groupsSubTab === "joined" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													Joined
												</button>
											</div>
										)}
									</div>
									<Select
										value={groupSort}
										onValueChange={(v) =>
											setGroupSort(v as typeof groupSort)
										}
									>
										<SelectTrigger className="w-44 h-8 text-xs">
											<SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="default">
												Default order
											</SelectItem>
											<SelectItem value="most_members">
												Most members
											</SelectItem>
											<SelectItem value="alphabetical">
												A → Z
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{groupsSubTab === "mine" ? (
									ownedGroups.length === 0 ? (
										<div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
											<p className="text-sm">
												No groups created yet
											</p>
										</div>
									) : (
										<GroupGrid
											groups={sortedAllGroups.filter(
												(g) => g.isOwned,
											)}
											emptyLabel="No groups created"
										/>
									)
								) : (
									<GroupGrid
										groups={sortedAllGroups.filter(
											(g) => !g.isOwned,
										)}
										emptyLabel="Not a member of any groups"
									/>
								)}
							</>
						)}
					</div>
				)}

				{activeTab === "Blogs" && (
					<div className="pb-10">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : blogs.length === 0 ? (
							<div className="text-center py-16 text-muted-foreground">
								<BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
								<p className="font-medium">No blog posts yet</p>
								{isOwnProfile && (
									<Link
										href="/blog/new"
										className="text-primary text-sm hover:underline mt-1 block"
									>
										Write your first blog →
									</Link>
								)}
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
									{isOwnProfile ? (
										<div className="flex items-center gap-2">
											<Link href="/blog/new">
												<Button
													size="sm"
													className="gap-1.5"
												>
													<BookOpen className="h-3.5 w-3.5" />
													Write New Blog
												</Button>
											</Link>
											<div className="flex rounded-lg border overflow-hidden text-xs">
												{(
													[
														"all",
														"published",
														"drafts",
													] as const
												).map((f) => (
													<button
														key={f}
														onClick={() =>
															setBlogPublishFilter(
																f,
															)
														}
														className={`px-2.5 py-1.5 font-medium capitalize transition-colors ${blogPublishFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
													>
														{f === "all"
															? `All (${blogs.length})`
															: f === "published"
																? `Published`
																: `Drafts`}
													</button>
												))}
											</div>
										</div>
									) : (
										<span />
									)}
									<Select
										value={blogSort}
										onValueChange={(v) =>
											setBlogSort(v as typeof blogSort)
										}
									>
										<SelectTrigger className="w-44 h-8 text-xs">
											<SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="newest">
												Newest first
											</SelectItem>
											<SelectItem value="oldest">
												Oldest first
											</SelectItem>
											<SelectItem value="most_liked">
												Most liked
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{sortedBlogs.map((blog) => (
									<Link
										key={blog.id}
										href={`/blog/${blog.slug}`}
									>
										<Card className="overflow-hidden hover:shadow-md transition-shadow mb-3">
											<div className="flex gap-0 flex-col sm:flex-row">
												{blog.coverImageUrl && (
													<div className="relative sm:w-36 w-full h-28 sm:h-auto shrink-0 bg-muted">
														<Image
															src={
																blog.coverImageUrl
															}
															alt={blog.title}
															fill
															className="object-cover"
														/>
													</div>
												)}
												<CardContent className="p-4 flex-1">
													<div className="flex items-start justify-between gap-2">
														<h3 className="font-semibold text-sm line-clamp-2 leading-snug flex-1">
															{blog.title}
														</h3>
														{!blog.published &&
															isOwnProfile && (
																<Badge
																	variant="outline"
																	className="text-[10px] shrink-0"
																>
																	Draft
																</Badge>
															)}
													</div>
													{blog.excerpt && (
														<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
															{blog.excerpt}
														</p>
													)}
													{blog.hashtags.length >
														0 && (
														<div className="flex flex-wrap gap-1 mt-2">
															{blog.hashtags
																.slice(0, 4)
																.map(
																	({
																		hashtag,
																	}) => (
																		<Badge
																			key={
																				hashtag.id
																			}
																			variant="secondary"
																			className="text-xs font-normal"
																		>
																			#
																			{
																				hashtag.name
																			}
																		</Badge>
																	),
																)}
														</div>
													)}
													<p className="text-xs text-muted-foreground mt-1.5">
														❤ {blog._count.likes}
													</p>
												</CardContent>
											</div>
										</Card>
									</Link>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === "Memories" && isOwnProfile && (
					<div className="pb-10">
						{currentUserId ? (
							initialMemories.length === 0 ? (
								<div className="text-center py-16 text-muted-foreground">
									<NotebookPen className="h-10 w-10 mx-auto mb-3 opacity-30" />
									<p className="font-medium">
										No memories saved yet
									</p>
									<p className="text-sm mt-1">
										Save posts to your memories to revisit
										them later.
									</p>
								</div>
							) : (
								<MemoriesClient
									memories={initialMemories as never[]}
									currentUserId={currentUserId}
								/>
							)
						) : (
							<PrivacyGate privacy="Private" />
						)}
					</div>
				)}

				{activeTab === "Saved" && isOwnProfile && (
					<div className="pb-10">
						{currentUserId ? (
							<SavedPostsClient
								initialPosts={initialSavedPosts as never[]}
								currentUserId={currentUserId}
							/>
						) : (
							<PrivacyGate privacy="Private" />
						)}
					</div>
				)}

				{activeTab === "Market" && (
					<div className="pb-10">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : marketListings.length === 0 ? (
							<div className="text-center py-16 text-muted-foreground">
								<ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
								<p className="font-medium">
									No marketplace listings
								</p>
								{isOwnProfile && (
									<Link
										href="/marketplace/sell"
										className="text-primary text-sm hover:underline mt-1 block"
									>
										Create your first listing →
									</Link>
								)}
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
									<div className="flex items-center gap-2">
										<div className="flex rounded-lg border overflow-hidden text-xs">
											{(
												[
													"all",
													"Active",
													"Sold",
												] as const
											).map((s) => (
												<button
													key={s}
													onClick={() =>
														setMarketStatusFilter(s)
													}
													className={`px-3 py-1.5 font-medium transition-colors ${marketStatusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													{s === "all"
														? `All (${marketListings.length})`
														: s}
												</button>
											))}
										</div>
										<span className="text-xs text-muted-foreground">
											{sortedMarket.length} listings
										</span>
									</div>
									<Select
										value={marketSort}
										onValueChange={(v) =>
											setMarketSort(
												v as typeof marketSort,
											)
										}
									>
										<SelectTrigger className="w-48 h-8 text-xs">
											<SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="newest">
												Newest first
											</SelectItem>
											<SelectItem value="oldest">
												Oldest first
											</SelectItem>
											<SelectItem value="price_asc">
												Price: Low → High
											</SelectItem>
											<SelectItem value="price_desc">
												Price: High → Low
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
									{sortedMarket.map((listing) => (
										<Link
											key={listing.id}
											href={`/marketplace/${listing.slug}`}
											className="group block"
										>
											<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
												<div className="relative aspect-square bg-muted">
													{listing.images[0] ? (
														<img
															src={
																listing
																	.images[0]
																	.url
															}
															alt={listing.title}
															className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center">
															<ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
														</div>
													)}
													{listing.status ===
														"Sold" && (
														<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
															<Badge className="bg-destructive text-white">
																Sold
															</Badge>
														</div>
													)}
													<Badge className="absolute top-2 left-2 text-xs bg-background/90 text-foreground font-semibold">
														{listing.isFree
															? "Free"
															: `$${listing.price}`}
													</Badge>
												</div>
												<CardContent className="p-2.5">
													<p className="font-semibold text-xs truncate group-hover:underline">
														{listing.title}
													</p>
													<p className="text-[10px] text-muted-foreground mt-0.5">
														{listing.category} ·{" "}
														{listing.condition}
													</p>
												</CardContent>
											</Card>
										</Link>
									))}
								</div>
							</div>
						)}
					</div>
				)}
				{activeTab === "More" && (
					<div className="pb-10 space-y-8">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : (
							<>
								{allPages.length > 0 && (
									<section className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="font-semibold text-base">
												Pages
											</h2>
											<div className="flex rounded-lg border overflow-hidden text-sm">
												<button
													onClick={() =>
														setPagesSubTab("mine")
													}
													className={`px-3 py-1 font-medium transition-colors ${pagesSubTab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													{isOwnProfile
														? "My Pages"
														: "Managed"}
												</button>
												<button
													onClick={() =>
														setPagesSubTab(
															"following",
														)
													}
													className={`px-3 py-1 font-medium transition-colors ${pagesSubTab === "following" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													Following
												</button>
											</div>
										</div>
										{pagesSubTab === "mine" &&
											(ownedPagesList.length === 0 ? (
												<div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
													<p className="text-sm">
														No pages managed yet
													</p>
												</div>
											) : isOwnProfile ? (
												<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
													{ownedPagesList.map((p) => (
														<div
															key={p.id}
															className="relative group"
														>
															<Link
																href={`/pages/${p.slug}`}
																className="block"
															>
																<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
																	<div className="relative h-24 bg-muted">
																		{p.coverUrl ? (
																			<Image
																				src={
																					p.coverUrl
																				}
																				alt={
																					p.name
																				}
																				fill
																				className="object-cover"
																				sizes="400px"
																			/>
																		) : (
																			<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
																				<Flag className="h-8 w-8 text-primary/30" />
																			</div>
																		)}
																		<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">
																			Admin
																		</Badge>
																	</div>
																	<CardContent className="p-3">
																		<div className="flex items-center gap-1.5">
																			<p className="font-semibold text-sm truncate flex-1">
																				{
																					p.name
																				}
																			</p>
																			{p.isVerified && (
																				<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
																			)}
																		</div>
																		<div className="flex items-center justify-between mt-0.5">
																			<p className="text-xs text-muted-foreground">
																				{
																					p.category
																				}
																			</p>
																			<p className="text-xs text-muted-foreground">
																				{p._count.followers.toLocaleString()}{" "}
																				followers
																			</p>
																		</div>
																	</CardContent>
																</Card>
															</Link>
															<button
																onClick={() =>
																	setDeleteConfirm(
																		{
																			type: "page",
																			id: p.id,
																			name: p.name,
																		},
																	)
																}
																className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-full p-1 hover:bg-destructive hover:text-white"
																title="Delete page"
															>
																<Trash2 className="h-3.5 w-3.5" />
															</button>
														</div>
													))}
												</div>
											) : (
												<PageGrid
													pages={ownedPagesList}
													emptyLabel="No managed pages"
												/>
											))}
										{pagesSubTab === "following" &&
											(followedPages.length === 0 ? (
												<div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
													<p className="text-sm">
														No followed pages yet
													</p>
												</div>
											) : (
												<PageGrid
													pages={followedPages}
													emptyLabel="No followed pages"
												/>
											))}
									</section>
								)}
								{allGroups.length > 0 && (
									<section className="space-y-6">
										<h2 className="font-semibold text-base">
											Groups
										</h2>
										{ownedGroups.length > 0 && (
											<div>
												<div className="flex items-center gap-2 mb-3">
													<div className="w-1 h-4 rounded-full bg-primary" />
													<h3 className="font-medium text-sm text-foreground">
														{isOwnProfile
															? "Groups I Created"
															: "Created Groups"}
													</h3>
												</div>
												{isOwnProfile ? (
													<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
														{ownedGroups.map(
															(g) => (
																<div
																	key={g.id}
																	className="relative group"
																>
																	<Link
																		href={`/groups/${g.slug}`}
																		className="block"
																	>
																		<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
																			<div className="relative h-28 bg-muted">
																				{g.coverUrl ? (
																					<Image
																						src={
																							g.coverUrl
																						}
																						alt={
																							g.name
																						}
																						fill
																						className="object-cover"
																						sizes="400px"
																					/>
																				) : (
																					<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
																						<Users className="h-10 w-10 text-primary/30" />
																					</div>
																				)}
																				<div className="absolute top-2 right-2 flex gap-1">
																					<Badge className="text-[10px] bg-primary text-primary-foreground">
																						Admin
																					</Badge>
																					<Badge
																						variant="secondary"
																						className="text-[10px] bg-background/90 backdrop-blur"
																					>
																						{g.privacy ===
																						"Public" ? (
																							<Globe className="h-3 w-3" />
																						) : (
																							<Lock className="h-3 w-3" />
																						)}
																						{
																							g.privacy
																						}
																					</Badge>
																				</div>
																			</div>
																			<CardContent className="p-3">
																				<p className="font-semibold text-sm truncate">
																					{
																						g.name
																					}
																				</p>
																				<p className="text-xs text-muted-foreground mt-0.5">
																					{g._count.members.toLocaleString()}{" "}
																					members
																				</p>
																			</CardContent>
																		</Card>
																	</Link>
																	<button
																		onClick={() =>
																			setDeleteConfirm(
																				{
																					type: "group",
																					id: g.id,
																					name: g.name,
																				},
																			)
																		}
																		className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-full p-1 hover:bg-destructive hover:text-white"
																		title="Delete group"
																	>
																		<Trash2 className="h-3.5 w-3.5" />
																	</button>
																</div>
															),
														)}
													</div>
												) : (
													<GroupGrid
														groups={ownedGroups}
														emptyLabel="No created groups"
													/>
												)}
											</div>
										)}
										{groups.filter(
											(g) =>
												!ownedGroups.find(
													(og) => og.id === g.id,
												),
										).length > 0 && (
											<div>
												<div className="flex items-center gap-2 mb-3">
													<div className="w-1 h-4 rounded-full bg-muted-foreground/50" />
													<h3 className="font-medium text-sm text-muted-foreground">
														{isOwnProfile
															? "Groups I Joined"
															: "Joined Groups"}
													</h3>
												</div>
												<GroupGrid
													groups={groups.filter(
														(g) =>
															!ownedGroups.find(
																(og) =>
																	og.id ===
																	g.id,
															),
													)}
													emptyLabel="No joined groups"
												/>
											</div>
										)}
									</section>
								)}
								{(createdEventsList.length > 0 ||
									attendingEvents.length > 0) && (
									<section className="space-y-4">
										<div className="flex items-center justify-between">
											<h2 className="font-semibold text-base">
												Events
											</h2>
											<div className="flex rounded-lg border overflow-hidden text-sm">
												<button
													onClick={() =>
														setEventsSubTab("mine")
													}
													className={`px-3 py-1 font-medium transition-colors ${eventsSubTab === "mine" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													{isOwnProfile
														? "Organized"
														: "Created"}
												</button>
												<button
													onClick={() =>
														setEventsSubTab(
															"attending",
														)
													}
													className={`px-3 py-1 font-medium transition-colors ${eventsSubTab === "attending" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
												>
													Attending
												</button>
											</div>
										</div>
										{eventsSubTab === "mine" &&
											(createdEventsList.length === 0 ? (
												<div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
													<p className="text-sm">
														No organized events yet
													</p>
												</div>
											) : isOwnProfile ? (
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
													{createdEventsList.map(
														(e) => (
															<div
																key={e.id}
																className="relative group"
															>
																<Link
																	href={`/events/${e.slug}`}
																	className="block"
																>
																	<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
																		<div className="relative h-28 bg-muted">
																			{e.coverUrl ? (
																				<Image
																					src={
																						e.coverUrl
																					}
																					alt={
																						e.title
																					}
																					fill
																					className="object-cover"
																					sizes="500px"
																				/>
																			) : (
																				<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
																					<CalendarCheck className="h-10 w-10 text-primary/30" />
																				</div>
																			)}
																			<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">
																				Organizer
																			</Badge>
																		</div>
																		<CardContent className="p-3">
																			<p className="font-semibold text-sm truncate">
																				{
																					e.title
																				}
																			</p>
																			<p className="text-xs text-muted-foreground mt-0.5">
																				{format(
																					new Date(
																						e.startDate,
																					),
																					"MMM d, yyyy",
																				)}
																				{e.isOnline
																					? " · Online"
																					: e.location
																						? ` · ${e.location}`
																						: ""}
																			</p>
																			<p className="text-xs text-muted-foreground">
																				{
																					e
																						._count
																						.attendees
																				}{" "}
																				attending
																			</p>
																		</CardContent>
																	</Card>
																</Link>
																<button
																	onClick={() =>
																		setDeleteConfirm(
																			{
																				type: "event",
																				id: e.id,
																				name: e.title,
																			},
																		)
																	}
																	className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-full p-1 hover:bg-destructive hover:text-white"
																	title="Delete event"
																>
																	<Trash2 className="h-3.5 w-3.5" />
																</button>
															</div>
														),
													)}
												</div>
											) : (
												<EventGrid
													events={createdEventsList}
													emptyLabel="No organized events"
												/>
											))}
										{eventsSubTab === "attending" &&
											(attendingEvents.length === 0 ? (
												<div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
													<p className="text-sm">
														{isOwnProfile
															? "Not attending any upcoming events"
															: "No events attended"}
													</p>
												</div>
											) : (
												<EventGrid
													events={attendingEvents}
													emptyLabel="No upcoming events"
												/>
											))}
									</section>
								)}
							</>
						)}
					</div>
				)}
			</div>

			{/* Story creation dialog */}
			<CreateStoryDialog
				open={createStoryOpen}
				onClose={() => setCreateStoryOpen(false)}
			/>

			{/* Block confirmation dialog */}
			<AlertDialog
				open={confirmBlockOpen}
				onOpenChange={setConfirmBlockOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{isBlocked ? `Unblock ${name}?` : `Block ${name}?`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{isBlocked
								? `${name} will be able to see your profile and contact you again.`
								: `${name} won't be able to see your profile, send you messages, or follow you.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleBlock}
							className={
								isBlocked
									? ""
									: "bg-destructive hover:bg-destructive/90"
							}
							disabled={blockPending}
						>
							{blockPending
								? "Processing..."
								: isBlocked
									? "Unblock"
									: "Block"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Report dialog */}
			<Dialog open={reportOpen} onOpenChange={setReportOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Report {name}</DialogTitle>
						<DialogDescription>
							Tell us why you think this account violates our
							community guidelines.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Textarea
							placeholder="Describe the issue..."
							value={reportReason}
							onChange={(e) => setReportReason(e.target.value)}
							className="resize-none min-h-[100px]"
							maxLength={500}
						/>
						<p className="text-xs text-muted-foreground text-right">
							{reportReason.length}/500
						</p>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setReportOpen(false)}
							disabled={reportPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleReport}
							disabled={reportPending || !reportReason.trim()}
						>
							{reportPending ? "Submitting..." : "Submit Report"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete page/group/event confirmation */}
			<AlertDialog
				open={!!deleteConfirm}
				onOpenChange={(o) => {
					if (!o) setDeleteConfirm(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete &quot;{deleteConfirm?.name}&quot;?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The{" "}
							{deleteConfirm?.type} will be permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteOwned}
							disabled={deletingId !== null}
							className="bg-destructive hover:bg-destructive/90"
						>
							{deletingId !== null ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

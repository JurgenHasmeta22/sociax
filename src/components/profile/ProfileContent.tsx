"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { format } from "date-fns";
import {
	sendFollowRequest,
	cancelFollowRequest,
	unfollowUser,
} from "@/actions/follow.actions";
import { PostCard } from "@/components/feed/PostCard";

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
	"Posts",
	"About",
	"Friends",
	"Groups",
	"Pages",
	"Events",
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
}) {
	const [activeTab, setActiveTab] = useState<Tab>("Posts");
	const [followState, setFollowState] = useState(initialFollowState);
	const [isPending, startTransition] = useTransition();
	const name = displayName(user);

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

	const allGroups = [
		...ownedGroups.map((g) => ({ ...g, isOwned: true })),
		...groups
			.filter((g) => !ownedGroups.find((og) => og.id === g.id))
			.map((g) => ({ ...g, isOwned: false })),
	];
	const allPages = [
		...ownedPages.map((p) => ({ ...p, isOwned: true })),
		...followedPages
			.filter((p) => !ownedPages.find((op) => op.id === p.id))
			.map((p) => ({ ...p, isOwned: false })),
	];

	return (
		<div>
			<div className="relative bg-muted h-56 md:h-72 overflow-hidden">
				{user.coverPhoto ? (
					<Image
						src={user.coverPhoto.photoSrc}
						alt="Cover"
						fill
						className="object-cover"
						sizes="100vw"
						priority
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5" />
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
			</div>

			<div className="max-w-5xl mx-auto px-4">
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-20 sm:-mt-14 pb-4 relative z-10">
					<div className="flex flex-col sm:flex-row sm:items-end gap-4">
						<div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full ring-4 ring-background shadow-xl overflow-hidden bg-muted shrink-0">
							{user.avatar ? (
								<Image
									src={user.avatar.photoSrc}
									alt={name}
									fill
									className="object-cover"
									sizes="176px"
								/>
							) : (
								<div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-5xl font-bold">
									{name[0]?.toUpperCase()}
								</div>
							)}
						</div>
						<div className="pb-2">
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="text-2xl font-bold leading-tight">
									{name}
								</h1>
								{user.profilePrivacy !== "Public" && (
									<Badge
										variant="secondary"
										className="gap-1 text-xs"
									>
										{user.profilePrivacy === "Private" ? (
											<Lock className="h-3 w-3" />
										) : (
											<Users className="h-3 w-3" />
										)}
										{user.profilePrivacy === "Private"
											? "Private"
											: "Friends only"}
									</Badge>
								)}
							</div>
							<p className="text-muted-foreground text-sm">
								@{user.userName}
							</p>
							<div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
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
								<span>
									<span className="font-semibold text-foreground">
										{user._count.posts.toLocaleString()}
									</span>{" "}
									posts
								</span>
							</div>
							{user.bio && (
								<p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">
									{user.bio}
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 pb-2">
						{isOwnProfile ? (
							<Button
								variant="secondary"
								className="gap-2 font-semibold"
								asChild
							>
								<Link href="/settings">Edit profile</Link>
							</Button>
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
								>
									<MessageCircle className="h-4 w-4" />
									Message
								</Button>
								<Button variant="secondary" size="icon">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</>
						)}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
					{user.location && (
						<span className="flex items-center gap-1">
							<MapPin className="h-4 w-4" />
							{user.location}
						</span>
					)}
					{user.website && (
						<a
							href={user.website}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-primary hover:underline"
						>
							<LinkIcon className="h-4 w-4" />
							{user.website.replace(/^https?:\/\//, "")}
						</a>
					)}
					{user.birthday && (
						<span className="flex items-center gap-1">
							<CalendarDays className="h-4 w-4" />
							Born{" "}
							{format(new Date(user.birthday), "MMMM d, yyyy")}
						</span>
					)}
				</div>

				<Separator />

				<div className="flex gap-0.5 mt-1 overflow-x-auto">
					{TABS.map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`relative px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-md transition-colors ${
								activeTab === tab
									? "text-primary"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							{tab}
							{activeTab === tab && (
								<span className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
							)}
						</button>
					))}
				</div>
				<Separator className="mb-6" />

				{activeTab === "Posts" && (
					<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 pb-10">
						<div className="space-y-4">
							<Card>
								<CardContent className="pt-4 pb-4">
									<h3 className="font-semibold mb-3">
										Intro
									</h3>
									{user.bio && (
										<p className="text-sm text-muted-foreground mb-3 leading-relaxed">
											{user.bio}
										</p>
									)}
									<div className="space-y-2 text-sm">
										{user.location && (
											<p className="flex items-center gap-2 text-muted-foreground">
												<MapPin className="h-4 w-4 shrink-0" />
												Lives in{" "}
												<span className="font-medium text-foreground">
													{user.location}
												</span>
											</p>
										)}
										{user.birthday && (
											<p className="flex items-center gap-2 text-muted-foreground">
												<CalendarDays className="h-4 w-4 shrink-0" />
												Born{" "}
												<span className="font-medium text-foreground">
													{format(
														new Date(user.birthday),
														"MMMM d, yyyy",
													)}
												</span>
											</p>
										)}
										{user.website && (
											<p className="flex items-center gap-2 text-muted-foreground">
												<LinkIcon className="h-4 w-4 shrink-0" />
												<a
													href={user.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary hover:underline truncate"
												>
													{user.website.replace(
														/^https?:\/\//,
														"",
													)}
												</a>
											</p>
										)}
									</div>
									<Separator className="my-3" />
									<div className="flex items-center justify-between text-sm text-muted-foreground">
										<button
											onClick={() =>
												setActiveTab("Friends")
											}
											className="hover:underline"
										>
											{user._count.followers} friends
										</button>
										<Badge variant="secondary">
											{user.gender}
										</Badge>
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
										<div className="grid grid-cols-3 gap-2">
											{friends.slice(0, 9).map((f) => {
												const n = displayName(f);
												return (
													<Link
														key={f.id}
														href={`/profile/${f.userName}`}
														className="flex flex-col items-center gap-1 group"
													>
														<Avatar className="h-14 w-14">
															<AvatarImage
																src={
																	f.avatar
																		?.photoSrc ??
																	undefined
																}
															/>
															<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
																{n[0]?.toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<span className="text-[10px] text-center text-muted-foreground group-hover:text-foreground truncate w-full text-center">
															{n.split(" ")[0]}
														</span>
													</Link>
												);
											})}
										</div>
									</CardContent>
								</Card>
							)}

							{canViewContent &&
								ownedGroups.length + groups.length > 0 && (
									<Card>
										<CardContent className="pt-4 pb-4">
											<div className="flex items-center justify-between mb-3">
												<h3 className="font-semibold">
													Groups
												</h3>
												<button
													onClick={() =>
														setActiveTab("Groups")
													}
													className="text-primary text-xs hover:underline"
												>
													See all
												</button>
											</div>
											<div className="space-y-2">
												{allGroups
													.slice(0, 4)
													.map((g) => (
														<Link
															key={g.id}
															href={`/groups/${g.slug}`}
															className="flex items-center gap-2.5 group"
														>
															<div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 relative">
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
																		sizes="40px"
																	/>
																) : (
																	<div className="w-full h-full bg-primary/10 flex items-center justify-center">
																		<Users className="h-4 w-4 text-primary/60" />
																	</div>
																)}
															</div>
															<div className="min-w-0 flex-1">
																<div className="flex items-center gap-1.5">
																	<p className="text-sm font-medium truncate group-hover:underline">
																		{g.name}
																	</p>
																	{g.isOwned && (
																		<Badge className="text-[9px] px-1 py-0 h-4 bg-primary text-primary-foreground shrink-0">
																			Admin
																		</Badge>
																	)}
																</div>
																<p className="text-xs text-muted-foreground">
																	{
																		g._count
																			.members
																	}{" "}
																	members
																</p>
															</div>
														</Link>
													))}
											</div>
										</CardContent>
									</Card>
								)}

							{canViewContent &&
								ownedPages.length + followedPages.length >
									0 && (
									<Card>
										<CardContent className="pt-4 pb-4">
											<div className="flex items-center justify-between mb-3">
												<h3 className="font-semibold">
													Pages
												</h3>
												<button
													onClick={() =>
														setActiveTab("Pages")
													}
													className="text-primary text-xs hover:underline"
												>
													See all
												</button>
											</div>
											<div className="space-y-2">
												{allPages
													.slice(0, 4)
													.map((p) => (
														<Link
															key={p.id}
															href={`/pages/${p.slug}`}
															className="flex items-center gap-2.5 group"
														>
															<div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 relative">
																{p.avatarUrl ? (
																	<Image
																		src={
																			p.avatarUrl
																		}
																		alt={
																			p.name
																		}
																		fill
																		className="object-cover"
																		sizes="40px"
																	/>
																) : (
																	<div className="w-full h-full bg-primary/10 flex items-center justify-center">
																		<Flag className="h-4 w-4 text-primary/60" />
																	</div>
																)}
															</div>
															<div className="min-w-0 flex-1">
																<div className="flex items-center gap-1.5">
																	<p className="text-sm font-medium truncate group-hover:underline">
																		{p.name}
																	</p>
																	{p.isOwned && (
																		<Badge className="text-[9px] px-1 py-0 h-4 bg-primary text-primary-foreground shrink-0">
																			Admin
																		</Badge>
																	)}
																</div>
																<p className="text-xs text-muted-foreground">
																	{p.category}
																</p>
															</div>
														</Link>
													))}
											</div>
										</CardContent>
									</Card>
								)}
						</div>

						<div>
							{!canViewContent ? (
								<PrivacyGate privacy={user.profilePrivacy} />
							) : user.posts.length === 0 ? (
								<div className="text-center py-20 text-muted-foreground">
									<BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
									<p className="font-medium">No posts yet</p>
								</div>
							) : (
								<div className="space-y-4">
									{user.posts.map((post) => (
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

				{activeTab === "About" && (
					<div className="max-w-xl pb-10">
						<Card>
							<CardContent className="pt-5 pb-5 space-y-4">
								<h3 className="font-semibold text-base">
									About {name.split(" ")[0]}
								</h3>
								{user.bio && (
									<p className="text-sm text-muted-foreground leading-relaxed">
										{user.bio}
									</p>
								)}
								<Separator />
								<div className="space-y-3 text-sm">
									{user.location && (
										<div className="flex items-center gap-3 text-muted-foreground">
											<MapPin className="h-4 w-4 shrink-0" />
											<span>
												Lives in{" "}
												<span className="font-medium text-foreground">
													{user.location}
												</span>
											</span>
										</div>
									)}
									{user.website && (
										<div className="flex items-center gap-3 text-muted-foreground">
											<LinkIcon className="h-4 w-4 shrink-0" />
											<a
												href={user.website}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline truncate"
											>
												{user.website.replace(
													/^https?:\/\//,
													"",
												)}
											</a>
										</div>
									)}
									{user.birthday && (
										<div className="flex items-center gap-3 text-muted-foreground">
											<CalendarDays className="h-4 w-4 shrink-0" />
											<span>
												Born{" "}
												<span className="font-medium text-foreground">
													{format(
														new Date(user.birthday),
														"MMMM d, yyyy",
													)}
												</span>
											</span>
										</div>
									)}
									<div className="flex items-center gap-3 text-muted-foreground">
										<Globe className="h-4 w-4 shrink-0" />
										<span>
											Profile is{" "}
											<span className="font-medium text-foreground">
												{user.profilePrivacy ===
												"FriendsOnly"
													? "Friends only"
													: user.profilePrivacy}
											</span>
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === "Friends" && (
					<div className="pb-10">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : (
							<>
								<p className="text-sm text-muted-foreground mb-4">
									{user._count.followers.toLocaleString()}{" "}
									friends · showing {friends.length}
								</p>
								<FriendGrid people={friends} />
							</>
						)}
					</div>
				)}

				{activeTab === "Groups" && (
					<div className="pb-10 space-y-8">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : (
							<>
								{ownedGroups.length > 0 && (
									<section>
										<h2 className="font-semibold text-base mb-3">
											Groups created
										</h2>
										<GroupGrid
											groups={ownedGroups}
											emptyLabel="No groups created"
										/>
									</section>
								)}
								<section>
									<h2 className="font-semibold text-base mb-3">
										{ownedGroups.length > 0
											? "Groups joined"
											: "Groups"}
									</h2>
									<GroupGrid
										groups={groups.filter(
											(g) =>
												!ownedGroups.find(
													(og) => og.id === g.id,
												),
										)}
										emptyLabel="Not a member of any groups"
									/>
								</section>
							</>
						)}
					</div>
				)}

				{activeTab === "Pages" && (
					<div className="pb-10 space-y-8">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : (
							<>
								{ownedPages.length > 0 && (
									<section>
										<h2 className="font-semibold text-base mb-3">
											Pages created
										</h2>
										<PageGrid
											pages={ownedPages}
											emptyLabel="No pages created"
										/>
									</section>
								)}
								<section>
									<h2 className="font-semibold text-base mb-3">
										{ownedPages.length > 0
											? "Pages following"
											: "Pages"}
									</h2>
									<PageGrid
										pages={followedPages.filter(
											(p) =>
												!ownedPages.find(
													(op) => op.id === p.id,
												),
										)}
										emptyLabel="Not following any pages"
									/>
								</section>
							</>
						)}
					</div>
				)}

				{activeTab === "Events" && (
					<div className="pb-10 space-y-8">
						{!canViewContent ? (
							<PrivacyGate privacy={user.profilePrivacy} />
						) : (
							<>
								{createdEvents.length > 0 && (
									<section>
										<h2 className="font-semibold text-base mb-3">
											Events created
										</h2>
										<EventGrid
											events={createdEvents}
											emptyLabel="No events created"
										/>
									</section>
								)}
								<section>
									<h2 className="font-semibold text-base mb-3">
										Attending
									</h2>
									<EventGrid
										events={attendingEvents}
										emptyLabel="Not attending any upcoming events"
									/>
								</section>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

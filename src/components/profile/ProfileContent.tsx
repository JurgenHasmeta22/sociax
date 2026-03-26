"use client";

import { useState } from "react";
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
	UserCheck,
	MessageCircle,
	MoreHorizontal,
	Globe,
	Users,
	Lock,
	ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type Post = {
	id: number;
	content: string | null;
	createdAt: Date;
	privacy: string;
	media: { id: number; url: string }[];
	likes: { id: number }[];
	_count: { comments: number };
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
	avatar: { photoSrc: string } | null;
	coverPhoto: { photoSrc: string } | null;
	_count: { followers: number; following: number; posts: number };
	posts: Post[];
};

const TABS = ["Posts", "About", "Friends", "Photos"] as const;
type Tab = (typeof TABS)[number];

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

const PrivacyIcon = ({ privacy }: { privacy: string }) => {
	const Icon =
		privacy === "Public" ? Globe : privacy === "FriendsOnly" ? Users : Lock;
	return <Icon className="h-3 w-3" />;
};

export function ProfileContent({
	user,
	isOwnProfile,
}: {
	user: ProfileUser;
	isOwnProfile: boolean;
}) {
	const [activeTab, setActiveTab] = useState<Tab>("Posts");
	const [following, setFollowing] = useState(false);
	const name = displayName(user);

	return (
		<div>
			<div className="relative bg-muted h-64 md:h-80 overflow-hidden">
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
					<div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
				)}
			</div>

			<div className="max-w-5xl mx-auto px-4">
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16 sm:-mt-12 pb-4">
					<div className="flex flex-col sm:flex-row sm:items-end gap-4">
						<div className="relative w-40 h-40 rounded-full ring-4 ring-background overflow-hidden bg-muted shrink-0">
							{user.avatar ? (
								<Image
									src={user.avatar.photoSrc}
									alt={name}
									fill
									className="object-cover"
									sizes="160px"
								/>
							) : (
								<div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-5xl font-bold">
									{name[0]?.toUpperCase()}
								</div>
							)}
						</div>
						<div className="pb-2">
							<h1 className="text-2xl font-bold leading-tight">
								{name}
							</h1>
							<p className="text-muted-foreground text-sm">
								@{user.userName}
							</p>
							<div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
								<span>
									<span className="font-semibold text-foreground">
										{user._count.followers.toLocaleString()}
									</span>{" "}
									followers
								</span>
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
						</div>
					</div>
					<div className="flex items-center gap-2 pb-2">
						{isOwnProfile ? (
							<Button
								variant="secondary"
								className="gap-2 font-semibold"
							>
								Edit profile
							</Button>
						) : (
							<>
								<Button
									onClick={() => setFollowing((p) => !p)}
									className="gap-2 font-semibold"
									variant={
										following ? "secondary" : "default"
									}
								>
									{following ? (
										<>
											<UserCheck className="h-4 w-4" />
											Following
										</>
									) : (
										<>
											<UserPlus className="h-4 w-4" />
											Follow
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

				{user.bio && (
					<p className="text-sm text-center sm:text-left text-muted-foreground mb-3 max-w-xl">
						{user.bio}
					</p>
				)}

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
							className="flex items-center gap-1 text-primary hover:underline"
						>
							<LinkIcon className="h-4 w-4" />
							{user.website.replace(/^https?:\/\//, "")}
						</a>
					)}
					{user.birthday && (
						<span className="flex items-center gap-1">
							<CalendarDays className="h-4 w-4" />
							Joined{" "}
							{format(new Date(user.birthday), "MMMM yyyy")}
						</span>
					)}
				</div>

				<Separator />

				<div className="flex gap-1 mt-1">
					{TABS.map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`relative px-4 py-3 text-sm font-semibold rounded-md transition-colors ${
								activeTab === tab
									? "text-primary"
									: "text-muted-foreground hover:bg-muted"
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
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
						<div className="space-y-4">
							<Card>
								<CardContent className="pt-4 pb-4">
									<h3 className="font-semibold mb-3">
										Intro
									</h3>
									{user.bio && (
										<p className="text-sm text-center text-muted-foreground mb-3">
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
									</div>
									<Separator className="my-3" />
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{user._count.followers} followers
										</span>
										<Badge variant="secondary">
											{user.gender}
										</Badge>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-2 space-y-3">
							{user.posts.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground">
									<p className="font-medium">No posts yet</p>
								</div>
							) : (
								user.posts.map((post) => (
									<Card key={post.id} className="shadow-sm">
										<CardContent className="pt-4">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<span>
														{formatDistanceToNow(
															new Date(
																post.createdAt,
															),
															{ addSuffix: true },
														)}
													</span>
													<span>·</span>
													<PrivacyIcon
														privacy={post.privacy}
													/>
												</div>
											</div>
											{post.content && (
												<p className="text-sm leading-relaxed">
													{post.content}
												</p>
											)}
											{post.media.length > 0 && (
												<div className="relative mt-3 h-64 rounded-lg overflow-hidden bg-muted">
													<Image
														src={post.media[0].url}
														alt=""
														fill
														className="object-cover"
														sizes="600px"
													/>
												</div>
											)}
											<div className="flex items-center gap-4 mt-3 pt-2 border-t text-xs text-muted-foreground">
												<span className="flex items-center gap-1">
													<ThumbsUp className="h-3.5 w-3.5" />
													{post.likes.length}
												</span>
												<span className="flex items-center gap-1">
													<MessageCircle className="h-3.5 w-3.5" />
													{post._count.comments}
												</span>
											</div>
										</CardContent>
									</Card>
								))
							)}
						</div>
					</div>
				)}

				{activeTab === "About" && (
					<div className="max-w-2xl mx-auto pb-8">
						<Card>
							<CardContent className="pt-6 space-y-4">
								<div>
									<h3 className="font-semibold mb-3 text-primary">
										Overview
									</h3>
									<div className="space-y-3 text-sm">
										{user.bio && (
											<div className="flex gap-3">
												<span className="text-muted-foreground w-24 shrink-0">
													Bio
												</span>
												<span>{user.bio}</span>
											</div>
										)}
										{user.location && (
											<div className="flex gap-3">
												<span className="text-muted-foreground w-24 shrink-0">
													Location
												</span>
												<span>{user.location}</span>
											</div>
										)}
										{user.birthday && (
											<div className="flex gap-3">
												<span className="text-muted-foreground w-24 shrink-0">
													Birthday
												</span>
												<span>
													{format(
														new Date(user.birthday),
														"MMMM d, yyyy",
													)}
												</span>
											</div>
										)}
										<div className="flex gap-3">
											<span className="text-muted-foreground w-24 shrink-0">
												Gender
											</span>
											<span>{user.gender}</span>
										</div>
										{user.website && (
											<div className="flex gap-3">
												<span className="text-muted-foreground w-24 shrink-0">
													Website
												</span>
												<a
													href={user.website}
													className="text-primary hover:underline"
												>
													{user.website}
												</a>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{activeTab === "Friends" && (
					<div className="max-w-2xl mx-auto pb-8">
						<p className="text-center text-muted-foreground py-12">
							Friends list is private.
						</p>
					</div>
				)}

				{activeTab === "Photos" && (
					<div className="pb-8">
						{user.posts.filter((p) => p.media.length > 0).length ===
						0 ? (
							<p className="text-center text-muted-foreground py-12">
								No photos yet.
							</p>
						) : (
							<div className="grid grid-cols-3 md:grid-cols-4 gap-1">
								{user.posts
									.filter((p) => p.media.length > 0)
									.map((p) => (
										<div
											key={p.id}
											className="relative aspect-square bg-muted overflow-hidden rounded"
										>
											<Image
												src={p.media[0].url}
												alt=""
												fill
												className="object-cover hover:scale-105 transition-transform duration-200"
												sizes="200px"
											/>
										</div>
									))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

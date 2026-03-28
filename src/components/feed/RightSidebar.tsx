import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, Hash } from "lucide-react";
import { SidebarFollowButton } from "@/components/feed/SidebarFollowButton";
import { formatCount } from "@/lib/utils";

type SuggestedUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	location: string | null;
	avatar: { photoSrc: string } | null;
	_count: { followers: number };
};

const name = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

const FALLBACK_TRENDS = [
	{ tag: "webdevelopers", posts: 1624 },
	{ tag: "uidesigners", posts: 820 },
	{ tag: "javascript", posts: 480 },
	{ tag: "react", posts: 320 },
];

export function RightSidebar({
	suggestedUsers,
	currentUserId,
	followStates,
	onlineFriendIds = [],
	trendingTags = [],
}: {
	suggestedUsers: SuggestedUser[];
	currentUserId: number;
	followStates: Record<number, string>;
	onlineFriendIds?: number[];
	trendingTags?: { name: string; _count: { posts: number } }[];
}) {
	const onlineFriends = suggestedUsers.filter((u) =>
		onlineFriendIds.includes(u.id),
	);
	const proMembers = suggestedUsers.slice(0, 2);
	const trends =
		trendingTags.length > 0
			? trendingTags.map((t) => ({ tag: t.name, posts: t._count.posts }))
			: FALLBACK_TRENDS;

	return (
		<div className="px-3 py-4 space-y-5">
			{/* People you may know */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold text-sm text-foreground">
						People you may know
					</h3>
					<Link
						href="/people"
						className="text-primary text-xs font-medium hover:underline"
					>
						See all
					</Link>
				</div>
				<div className="space-y-3">
					{suggestedUsers.map((user) => {
						const displayName = name(user);
						return (
							<div
								key={user.id}
								className="flex items-center gap-2.5"
							>
								<Link
									href={`/profile/${user.userName}`}
									className="shrink-0"
								>
									<Avatar className="h-10 w-10">
										<AvatarImage
											src={
												user.avatar?.photoSrc ??
												undefined
											}
										/>
										<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
											{displayName[0]?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</Link>
								<div className="flex-1 min-w-0">
									<Link href={`/profile/${user.userName}`}>
										<p className="font-semibold text-sm leading-tight hover:underline truncate">
											{displayName}
										</p>
									</Link>
									<p className="text-xs text-muted-foreground mt-0.5">
									{formatCount(user._count.followers)}{" "}
									followers
									</p>
								</div>
								<SidebarFollowButton
									userId={user.id}
									initialState={
										followStates[user.id] === "accepted"
											? "accepted"
											: followStates[user.id] ===
												  "pending"
												? "outgoing_pending"
												: "none"
									}
								/>
							</div>
						);
					})}
				</div>
			</div>

			{/* Online Friends */}
			{onlineFriends.length > 0 && (
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold text-sm text-foreground">
							Online Friends
						</h3>
						<button className="text-muted-foreground hover:text-foreground transition-colors">
							<RefreshCw className="h-3.5 w-3.5" />
						</button>
					</div>
					<div className="flex items-center">
						<div className="flex -space-x-2">
							{onlineFriends.map((user) => {
								const displayName = name(user);
								return (
									<Link
										key={user.id}
										href={`/profile/${user.userName}`}
										title={displayName}
										className="relative shrink-0"
									>
										<Avatar className="h-9 w-9 ring-2 ring-background">
											<AvatarImage
												src={
													user.avatar?.photoSrc ??
													undefined
												}
											/>
											<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
												{displayName[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Pro Members */}
			{proMembers.length > 0 && (
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="font-semibold text-sm text-foreground">
							Pro Members
						</h3>
					</div>
					<div className="grid grid-cols-2 gap-2">
						{proMembers.map((user) => {
							const displayName = name(user);
							return (
								<div
									key={user.id}
									className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50"
								>
									<Avatar className="h-14 w-14 ring-2 ring-primary/20">
										<AvatarImage
											src={
												user.avatar?.photoSrc ??
												undefined
											}
										/>
										<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
											{displayName[0]?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="text-center">
										<p className="font-semibold text-xs truncate max-w-full">
											{displayName}
										</p>
										<p className="text-[11px] text-muted-foreground">
										{formatCount(user._count.followers)}{" "}
										followers
										</p>
									</div>
									<SidebarFollowButton
										userId={user.id}
										initialState={
											followStates[user.id] === "accepted"
												? "accepted"
												: followStates[user.id] ===
													  "pending"
													? "outgoing_pending"
													: "none"
										}
									/>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Trends for you */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold text-sm text-foreground">
						Trends for you
					</h3>
					<button className="text-muted-foreground hover:text-foreground transition-colors">
						<RefreshCw className="h-3.5 w-3.5" />
					</button>
				</div>
				<div className="space-y-2.5">
					{trends.map((trend) => (
						<Link
							key={trend.tag}
							href={`/hashtags/${encodeURIComponent(trend.tag)}`}
							className="flex items-center gap-2.5 group"
						>
							<div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
								<Hash className="h-3.5 w-3.5 text-primary" />
							</div>
							<div className="min-w-0">
								<p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
									#{trend.tag}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{trend.posts.toLocaleString()} posts
								</p>
							</div>
						</Link>
					))}
				</div>
			</div>

			{/* Footer */}
			<div className="flex flex-wrap gap-x-2 gap-y-1 pt-1">
				{["About", "Privacy", "Terms", "Advertising", "Support"].map(
					(item) => (
						<a
							key={item}
							href="#"
							className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
						>
							{item}
						</a>
					),
				)}
				<span className="text-xs text-muted-foreground/60">
					Sociax © 2026
				</span>
			</div>
		</div>
	);
}

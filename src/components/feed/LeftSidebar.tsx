"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
	Home,
	Users,
	UsersRound,
	Flag,
	CalendarDays,
	Bookmark,
	Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarUser = {
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
	_count: {
		followers: number;
		posts: number;
	};
};

const LINKS = [
	{ href: "/feed", icon: Home, label: "Home" },
	{ href: "/people", icon: Users, label: "People" },
	{ href: "/groups", icon: UsersRound, label: "Groups" },
	{ href: "/pages", icon: Flag, label: "Pages" },
	{ href: "/events", icon: CalendarDays, label: "Events" },
	{ href: "/saved", icon: Bookmark, label: "Saved" },
	{ href: "/memories", icon: Clock, label: "Memories" },
];

export function LeftSidebar({ user }: { user: SidebarUser }) {
	const pathname = usePathname();
	const displayName =
		[user.firstName, user.lastName].filter(Boolean).join(" ") ||
		user.userName;

	return (
		<div className="px-2 py-3 space-y-1">
			<Link
				href={`/profile/${user.userName}`}
				className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors mb-1"
			>
				<Avatar className="h-9 w-9 shrink-0">
					<AvatarImage src={user.avatar?.photoSrc ?? undefined} />
					<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
						{displayName[0]?.toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<span className="font-semibold text-sm truncate">
					{displayName}
				</span>
			</Link>

			{LINKS.map(({ href, icon: Icon, label }) => {
				const isActive = pathname === href;
				return (
					<Link
						key={href}
						href={href}
						className={cn(
							"flex items-center gap-3 px-2 py-2 rounded-lg transition-colors font-medium text-sm",
							isActive
								? "bg-primary/10 text-primary"
								: "text-foreground hover:bg-muted",
						)}
					>
						<div
							className={cn(
								"w-9 h-9 rounded-full flex items-center justify-center shrink-0",
								isActive ? "bg-primary/20" : "bg-muted",
							)}
						>
							<Icon
								className={cn(
									"h-[18px] w-[18px]",
									isActive
										? "text-primary"
										: "text-foreground",
								)}
							/>
						</div>
						{label}
					</Link>
				);
			})}

			<Separator className="my-3" />

			<p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
				Your stats
			</p>
			<div className="grid grid-cols-2 gap-1 px-2 py-1">
				{[
					{ label: "Posts", value: user._count.posts },
					{ label: "Friends", value: user._count.followers },
				].map(({ label, value }) => (
					<div
						key={label}
						className="text-center py-2 rounded-lg bg-muted"
					>
						<p className="font-bold text-sm text-foreground">
							{value}
						</p>
						<p className="text-[10px] text-muted-foreground leading-tight">
							{label}
						</p>
					</div>
				))}
			</div>

			<Separator className="my-3" />
			<p className="px-2 text-xs text-muted-foreground">Sociax © 2026</p>
		</div>
	);
}

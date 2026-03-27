"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
Home,
MessageCircle,
Video,
CalendarDays,
Flag,
UsersRound,
ShoppingBag,
BookOpen,
ChevronDown,
Bookmark,
Clock,
Users,
Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type ShortcutUser = {
userName: string;
firstName: string | null;
lastName: string | null;
avatar: { photoSrc: string } | null;
};

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

const PRIMARY_LINKS = [
{ href: "/feed", icon: Home, label: "Feed", color: "bg-blue-600" },
{ href: "/messages", icon: MessageCircle, label: "Messages", color: "bg-teal-500" },
{ href: "/video", icon: Video, label: "Video", color: "bg-indigo-500" },
{ href: "/events", icon: CalendarDays, label: "Event", color: "bg-green-500" },
{ href: "/pages", icon: Flag, label: "Pages", color: "bg-rose-500" },
{ href: "/groups", icon: UsersRound, label: "Groups", color: "bg-amber-500" },
{ href: "/marketplace", icon: ShoppingBag, label: "Marketplace", color: "bg-purple-500" },
{ href: "/blog", icon: BookOpen, label: "Blog", color: "bg-sky-500" },
];

const MORE_LINKS = [
{ href: "/people", icon: Users, label: "People", color: "bg-pink-500" },
{ href: "/saved", icon: Bookmark, label: "Saved", color: "bg-amber-600" },
{ href: "/memories", icon: Clock, label: "Memories", color: "bg-cyan-500" },
];

const PAGE_LINKS = [
{ href: "/settings", icon: Settings, label: "Setting" },
];

interface NavLinkDef {
href: string;
icon: React.ElementType;
label: string;
color: string;
}

function NavLink({ href, icon: Icon, label, color, isActive }: NavLinkDef & { isActive: boolean }) {
return (
<Link
href={href}
className={cn(
"flex items-center gap-3 px-2 py-2 rounded-xl transition-colors font-medium text-sm",
isActive
? "bg-primary/15 text-foreground"
: "text-foreground/75 hover:bg-muted hover:text-foreground",
)}
>
<div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", color)}>
<Icon className="h-[18px] w-[18px] text-white" />
</div>
{label}
</Link>
);
}

export function LeftSidebar({
user,
shortcuts = [],
}: {
user: SidebarUser;
shortcuts?: ShortcutUser[];
}) {
const pathname = usePathname();
const [showMore, setShowMore] = useState(false);

const displayName =
[user.firstName, user.lastName].filter(Boolean).join(" ") || user.userName;

return (
<div className="px-3 py-4 space-y-0.5">
{/* Profile */}
<Link
href={`/profile/${user.userName}`}
className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-muted transition-colors mb-2"
>
<Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/30">
<AvatarImage src={user.avatar?.photoSrc ?? undefined} />
<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
{displayName[0]?.toUpperCase()}
</AvatarFallback>
</Avatar>
<div className="min-w-0">
<span className="font-semibold text-sm block truncate">{displayName}</span>
<span className="text-xs text-muted-foreground truncate block">@{user.userName}</span>
</div>
</Link>

{/* Primary nav */}
{PRIMARY_LINKS.map((link) => (
<NavLink key={link.href} {...link} isActive={pathname === link.href} />
))}

{/* More links */}
{showMore && MORE_LINKS.map((link) => (
<NavLink key={link.href} {...link} isActive={pathname === link.href} />
))}

{/* See More toggle */}
<button
onClick={() => setShowMore((p) => !p)}
className="flex items-center gap-3 px-2 py-2 rounded-xl w-full text-left transition-colors font-medium text-sm text-foreground/75 hover:bg-muted hover:text-foreground"
>
<div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-muted">
<ChevronDown className={cn("h-[18px] w-[18px] transition-transform duration-200", showMore && "rotate-180")} />
</div>
{showMore ? "See Less" : "See More"}
</button>

{/* Shortcut friends */}
{shortcuts.length > 0 && (
<>
<p className="px-2 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
Online Friends
</p>
{shortcuts.map((friend) => {
const friendName =
[friend.firstName, friend.lastName].filter(Boolean).join(" ") || friend.userName;
return (
<Link
key={friend.userName}
href={`/profile/${friend.userName}`}
className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors"
>
<div className="relative shrink-0">
<Avatar className="h-9 w-9 ring-2 ring-primary/20">
<AvatarImage src={friend.avatar?.photoSrc ?? undefined} />
<AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
{friendName[0]?.toUpperCase()}
</AvatarFallback>
</Avatar>
<span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
</div>
<span className="text-sm font-medium truncate text-foreground/80">{friendName}</span>
</Link>
);
})}
</>
)}

{/* Pages section */}
<p className="px-2 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
Pages
</p>
{PAGE_LINKS.map(({ href, icon: Icon, label }) => (
<Link
key={href}
href={href}
className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors text-sm font-medium text-foreground/75 hover:text-foreground"
>
<div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
<Icon className="h-[18px] w-[18px] text-muted-foreground" />
</div>
{label}
</Link>
))}

<p className="px-2 pt-4 text-xs text-muted-foreground/60">
Sociax © 2026 · Privacy · Terms
</p>
</div>
);
}

"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, Loader2 } from "lucide-react";
import { GroupJoinButton } from "@/components/groups/GroupJoinButton";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import {
fetchMoreGroups,
fetchPopularGroups,
fetchMyGroups,
} from "@/actions/group.actions";

type Tab = "suggestions" | "popular" | "mygroups";

type Group = {
id: number;
name: string;
slug: string;
description: string | null;
coverUrl: string | null;
avatarUrl: string | null;
privacy: string;
owner: {
id: number;
userName: string;
firstName: string | null;
lastName: string | null;
avatar: { photoSrc: string } | null;
};
_count: { members: number; posts: number };
};

const CATEGORY_COLORS: Record<string, string> = {
Shopping: "from-gray-800 to-gray-600",
Health: "from-red-500 to-red-700",
Science: "from-yellow-400 to-yellow-600",
Travel: "from-green-600 to-green-800",
Business: "from-sky-400 to-sky-600",
Technology: "from-blue-500 to-blue-700",
Arts: "from-purple-500 to-purple-700",
Sports: "from-orange-500 to-orange-700",
};

const STATIC_CATEGORIES = [
"Shopping",
"Health",
"Science",
"Travel",
"Business",
"Technology",
"Arts",
"Sports",
];

function formatCount(n: number) {
if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
return String(n);
}

function FeaturedGroupCard({
group,
membershipMap,
isLoggedIn,
}: {
group: Group;
membershipMap: Record<number, string>;
isLoggedIn: boolean;
}) {
return (
<div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
<Link href={`/groups/${group.slug}`}>
<div className="relative h-36 bg-muted">
{group.coverUrl ? (
<Image
src={group.coverUrl}
alt={group.name}
fill
className="object-cover"
sizes="320px"
/>
) : (
<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
<Users className="h-10 w-10 text-primary/30" />
</div>
)}
{group.avatarUrl && (
<div className="absolute bottom-0 translate-y-1/2 left-4">
<div className="relative w-10 h-10 rounded-full ring-2 ring-background overflow-hidden bg-muted">
<Image
src={group.avatarUrl}
alt=""
fill
className="object-cover"
sizes="40px"
/>
</div>
</div>
)}
</div>
</Link>
<div className={group.avatarUrl ? "pt-7 px-4 pb-4" : "pt-4 px-4 pb-4"}>
<Link href={`/groups/${group.slug}`}>
<h3 className="font-bold text-sm leading-tight truncate hover:underline">
{group.name}
</h3>
</Link>
<p className="text-xs text-muted-foreground mt-0.5">
{group.privacy} &middot; {formatCount(group._count.members)} members
</p>
{isLoggedIn && (
<div className="flex gap-2 mt-3">
<GroupJoinButton
groupId={group.id}
initialState={
(membershipMap[group.id] ?? "none") as
| "none"
| "Pending"
| "Approved"
| "Banned"
}
privacy={group.privacy}
/>
<Button variant="secondary" size="sm" className="shrink-0" asChild>
<Link href={`/groups/${group.slug}`}>View</Link>
</Button>
</div>
)}
</div>
</div>
);
}

function SuggestionGroupRow({
group,
membershipMap,
isLoggedIn,
}: {
group: Group;
membershipMap: Record<number, string>;
isLoggedIn: boolean;
}) {
const ownerName =
[group.owner.firstName, group.owner.lastName]
.filter(Boolean)
.join(" ") || group.owner.userName;

return (
<div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:shadow-sm transition-shadow">
<Link
href={`/groups/${group.slug}`}
className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0"
>
{group.coverUrl ? (
<Image
src={group.coverUrl}
alt={group.name}
fill
className="object-cover"
sizes="56px"
/>
) : (
<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
<Users className="h-6 w-6 text-primary/40" />
</div>
)}
</Link>
<div className="flex-1 min-w-0">
<Link href={`/groups/${group.slug}`}>
<p className="font-semibold text-sm truncate hover:underline">
{group.name}
</p>
</Link>
<p className="text-xs text-muted-foreground">
{formatCount(group._count.members)} Members &middot;{" "}
{group._count.posts} posts a week
</p>
<div className="flex items-center gap-1 mt-0.5">
<Avatar className="h-4 w-4">
<AvatarImage src={group.owner.avatar?.photoSrc ?? undefined} />
<AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
{ownerName[0]?.toUpperCase()}
</AvatarFallback>
</Avatar>
</div>
</div>
{isLoggedIn && (
<GroupJoinButton
groupId={group.id}
initialState={
(membershipMap[group.id] ?? "none") as
| "none"
| "Pending"
| "Approved"
| "Banned"
}
privacy={group.privacy}
compact
/>
)}
</div>
);
}

export function GroupsClient({
initialSuggestions,
initialPopular,
initialMyGroups,
totalSuggestions,
totalPopular,
totalMyGroups,
membershipMap: initialMembershipMap,
isLoggedIn,
}: {
initialSuggestions: Group[];
initialPopular: Group[];
initialMyGroups: Group[];
totalSuggestions: number;
totalPopular: number;
totalMyGroups: number;
membershipMap: Record<number, string>;
isLoggedIn: boolean;
}) {
const [tab, setTab] = useState<Tab>("suggestions");
const [groups, setGroups] = useState<Group[]>(initialSuggestions);
const [total, setTotal] = useState(totalSuggestions);
const [membershipMap, setMembershipMap] =
useState<Record<number, string>>(initialMembershipMap);
const [query, setQuery] = useState("");
const [skip, setSkip] = useState(initialSuggestions.length);
const [isPending, startTransition] = useTransition();
const [showCreate, setShowCreate] = useState(false);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
if (tab === "suggestions") {
setGroups(initialSuggestions);
setTotal(totalSuggestions);
setSkip(initialSuggestions.length);
} else if (tab === "popular") {
setGroups(initialPopular);
setTotal(totalPopular);
setSkip(initialPopular.length);
} else {
setGroups(initialMyGroups);
setTotal(totalMyGroups);
setSkip(initialMyGroups.length);
}
setMembershipMap(initialMembershipMap);
setQuery("");
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [tab]);

useEffect(() => {
if (debounceRef.current) clearTimeout(debounceRef.current);
debounceRef.current = setTimeout(() => {
startTransition(async () => {
let result;
if (tab === "suggestions") {
result = await fetchMoreGroups(0, query);
} else if (tab === "popular") {
result = await fetchPopularGroups(0, query);
} else {
result = await fetchMyGroups(0, query);
}
setGroups(result.groups as Group[]);
setMembershipMap(result.membershipMap);
setTotal(result.total);
setSkip(result.groups.length);
});
}, 500);
return () => {
if (debounceRef.current) clearTimeout(debounceRef.current);
};
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [query]);

const handleLoadMore = () => {
startTransition(async () => {
let result;
if (tab === "suggestions") {
result = await fetchMoreGroups(skip, query);
} else if (tab === "popular") {
result = await fetchPopularGroups(skip, query);
} else {
result = await fetchMyGroups(skip, query);
}
setGroups((p) => [...p, ...(result.groups as Group[])]);
setMembershipMap((p) => ({ ...p, ...result.membershipMap }));
setSkip((p) => p + result.groups.length);
});
};

const hasMore = groups.length < total;
const featured = groups.slice(0, 4);
const suggestionList = groups.slice(4);

const TABS: { key: Tab; label: string }[] = [
{ key: "suggestions", label: "Suggestions" },
{ key: "popular", label: "Popular" },
{ key: "mygroups", label: "My Groups" },
];

return (
<div className="max-w-5xl mx-auto px-4 py-6">
<div className="flex items-center justify-between mb-1">
<h1 className="text-2xl font-bold">Groups</h1>
{isLoggedIn && (
<Button className="gap-2 font-semibold" onClick={() => setShowCreate(true)}>
Create Group
</Button>
)}
</div>

<div className="flex gap-0 border-b border-border mb-6">
{TABS.map(({ key, label }) => (
<button
key={key}
onClick={() => setTab(key)}
className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
tab === key
? "text-foreground"
: "text-muted-foreground hover:text-foreground"
}`}
>
{label}
{tab === key && (
<span className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground rounded-t-full" />
)}
</button>
))}
</div>

{isPending && groups.length === 0 ? (
<div className="flex justify-center py-20">
<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
</div>
) : groups.length === 0 ? (
<div className="text-center py-20 text-muted-foreground">
<Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
<p className="font-medium text-lg">No groups found</p>
{tab === "mygroups" && (
<p className="text-sm mt-1">You haven&apos;t joined any groups yet</p>
)}
</div>
) : (
<>
{featured.length > 0 && (
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
{featured.map((group) => (
<FeaturedGroupCard
key={group.id}
group={group}
membershipMap={membershipMap}
isLoggedIn={isLoggedIn}
/>
))}
</div>
)}

{tab === "suggestions" && (
<div className="mb-8">
<div className="flex items-center justify-between mb-1">
<div>
<h2 className="text-lg font-bold">Categories</h2>
<p className="text-xs text-muted-foreground">
Find a group by browsing top categories.
</p>
</div>
<button className="text-sm text-primary hover:underline font-medium">
See all
</button>
</div>
<div className="relative mt-3">
<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
{STATIC_CATEGORIES.map((cat) => (
<div
key={cat}
className={`relative shrink-0 w-36 h-24 rounded-xl overflow-hidden cursor-pointer bg-gradient-to-br ${
CATEGORY_COLORS[cat] ?? "from-gray-600 to-gray-800"
} hover:opacity-90 transition-opacity`}
>
<div className="absolute inset-0 flex items-end p-3">
<span className="text-white font-semibold text-sm drop-shadow">
{cat}
</span>
</div>
</div>
))}
</div>
<button className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors">
<ChevronRight className="h-4 w-4" />
</button>
</div>
</div>
)}

{suggestionList.length > 0 && (
<div className="mb-6">
<div className="flex items-center justify-between mb-1">
<div>
<h2 className="text-lg font-bold">
{tab === "mygroups" ? "Your Groups" : "Suggestions"}
</h2>
<p className="text-xs text-muted-foreground">
{tab === "mygroups"
? "Groups you have joined."
: "Find a group you might be interested in."}
</p>
</div>
<button className="text-sm text-primary hover:underline font-medium">
See all
</button>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
{suggestionList.map((group) => (
<SuggestionGroupRow
key={group.id}
group={group}
membershipMap={membershipMap}
isLoggedIn={isLoggedIn}
/>
))}
</div>
</div>
)}

{hasMore && (
<div className="flex justify-center mt-4">
<Button
variant="outline"
onClick={handleLoadMore}
disabled={isPending}
className="min-w-36"
>
{isPending ? (
<Loader2 className="h-4 w-4 animate-spin" />
) : (
"Load more"
)}
</Button>
</div>
)}
</>
)}

{isLoggedIn && (
<CreateGroupDialog
open={showCreate}
onClose={() => setShowCreate(false)}
/>
)}
</div>
);
}

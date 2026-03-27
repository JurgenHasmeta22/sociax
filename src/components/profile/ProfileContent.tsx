"use client";

import { useState, useTransition, useRef } from "react";
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
Camera,
GraduationCap,
Briefcase,
Heart,
Radio,
Search,
Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { sendFollowRequest, cancelFollowRequest, unfollowUser } from "@/actions/follow.actions";
import { updateAvatar, updateCoverPhoto } from "@/actions/user.actions";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { toast } from "sonner";

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

const TABS = ["Timeline", "Friends", "Photos", "Videos", "Groups", "More"] as const;
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
<Link key={person.id} href={`/profile/${person.userName}`} className="group block">
<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
<div className="relative h-24 bg-muted">
<Avatar className="w-full h-full rounded-none">
<AvatarImage src={person.avatar?.photoSrc ?? undefined} className="object-cover" />
<AvatarFallback className="rounded-none text-2xl bg-primary text-primary-foreground h-full w-full">
{n[0]?.toUpperCase()}
</AvatarFallback>
</Avatar>
</div>
<CardContent className="p-2.5">
<p className="font-semibold text-sm leading-tight truncate group-hover:underline">{n}</p>
<p className="text-xs text-muted-foreground mt-0.5">{person._count.following} friends</p>
</CardContent>
</Card>
</Link>
);
})}
</div>
);
}

function GroupGrid({ groups, emptyLabel }: { groups: GroupItem[]; emptyLabel: string }) {
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
<Link key={g.id} href={`/groups/${g.slug}`} className="group block">
<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
<div className="relative h-28 bg-muted">
{g.coverUrl ? (
<Image src={g.coverUrl} alt={g.name} fill className="object-cover" sizes="400px" />
) : (
<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
<Users className="h-10 w-10 text-primary/30" />
</div>
)}
<div className="absolute top-2 right-2 flex gap-1">
{g.isOwned && (
<Badge className="text-[10px] bg-primary text-primary-foreground gap-1">Admin</Badge>
)}
<Badge variant="secondary" className="text-[10px] bg-background/90 backdrop-blur gap-1">
{g.privacy === "Public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
{g.privacy}
</Badge>
</div>
</div>
<CardContent className="p-3">
<p className="font-semibold text-sm truncate group-hover:underline">{g.name}</p>
<p className="text-xs text-muted-foreground mt-0.5">{g._count.members.toLocaleString()} members</p>
</CardContent>
</Card>
</Link>
))}
</div>
);
}

function PageGrid({ pages, emptyLabel }: { pages: PageItem[]; emptyLabel: string }) {
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
<Link key={p.id} href={`/pages/${p.slug}`} className="group block">
<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
<div className="relative h-24 bg-muted">
{p.coverUrl ? (
<Image src={p.coverUrl} alt={p.name} fill className="object-cover" sizes="400px" />
) : (
<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
<Flag className="h-8 w-8 text-primary/30" />
</div>
)}
{p.isOwned && (
<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">Admin</Badge>
)}
</div>
<CardContent className="p-3">
<div className="flex items-center gap-1.5">
<p className="font-semibold text-sm truncate group-hover:underline flex-1">{p.name}</p>
{p.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
</div>
<div className="flex items-center justify-between mt-0.5">
<p className="text-xs text-muted-foreground">{p.category}</p>
<p className="text-xs text-muted-foreground">{p._count.followers.toLocaleString()} followers</p>
</div>
</CardContent>
</Card>
</Link>
))}
</div>
);
}

function EventGrid({ events, emptyLabel }: { events: EventItem[]; emptyLabel: string }) {
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
<Link key={e.id} href={`/events/${e.slug}`} className="group block">
<Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
<div className="relative h-28 bg-muted">
{e.coverUrl ? (
<Image src={e.coverUrl} alt={e.title} fill className="object-cover" sizes="500px" />
) : (
<div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
<CalendarCheck className="h-10 w-10 text-primary/30" />
</div>
)}
{e.isOwned && (
<Badge className="absolute top-2 right-2 text-[10px] bg-primary text-primary-foreground">Organizer</Badge>
)}
</div>
<CardContent className="p-3">
<p className="font-semibold text-sm truncate group-hover:underline">{e.title}</p>
<p className="text-xs text-muted-foreground mt-0.5">
{format(new Date(e.startDate), "MMM d, yyyy")}
{e.isOnline ? " · Online" : e.location ? ` · ${e.location}` : ""}
</p>
<p className="text-xs text-muted-foreground">{e._count.attendees} attending</p>
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
const [activeTab, setActiveTab] = useState<Tab>("Timeline");
const [followState, setFollowState] = useState(initialFollowState);
const [isPending, startTransition] = useTransition();
const [avatarSrc, setAvatarSrc] = useState(user.avatar?.photoSrc ?? null);
const [coverSrc, setCoverSrc] = useState(user.coverPhoto?.photoSrc ?? null);
const [posts, setPosts] = useState<Post[]>(user.posts);
const avatarInputRef = useRef<HTMLInputElement>(null);
const coverInputRef = useRef<HTMLInputElement>(null);
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

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file) return;
const preview = URL.createObjectURL(file);
setAvatarSrc(preview);
try {
const fd = new FormData();
fd.append("file", file);
const res = await fetch("/api/upload", { method: "POST", body: fd });
if (!res.ok) throw new Error();
const { url } = await res.json();
setAvatarSrc(url);
await updateAvatar(url);
toast.success("Profile picture updated");
} catch {
toast.error("Failed to update profile picture");
}
};

const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file) return;
const preview = URL.createObjectURL(file);
setCoverSrc(preview);
try {
const fd = new FormData();
fd.append("file", file);
const res = await fetch("/api/upload", { method: "POST", body: fd });
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
...ownedGroups.map((g) => ({ ...g, isOwned: true })),
...groups.filter((g) => !ownedGroups.find((og) => og.id === g.id)).map((g) => ({ ...g, isOwned: false })),
];
const allPages = [
...ownedPages.map((p) => ({ ...p, isOwned: true })),
...followedPages.filter((p) => !ownedPages.find((op) => op.id === p.id)).map((p) => ({ ...p, isOwned: false })),
];

return (
<div className="pb-10">
{/* Cover photo */}
<div className="relative bg-muted h-56 md:h-72 overflow-hidden group">
{coverSrc ? (
<Image src={coverSrc} alt="Cover" fill className="object-cover" sizes="100vw" priority unoptimized />
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
<Image src={avatarSrc} alt={name} fill className="object-cover" sizes="144px" unoptimized />
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
onClick={() => avatarInputRef.current?.click()}
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
<button onClick={() => setActiveTab("Friends")} className="hover:underline">
<span className="font-semibold text-foreground">{user._count.followers.toLocaleString()}</span> friends
</button>
<span>
<span className="font-semibold text-foreground">{user._count.following.toLocaleString()}</span> following
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
<Button variant="secondary" size="icon">
<MoreHorizontal className="h-4 w-4" />
</Button>
</>
) : (
<>
<Button
onClick={handleFollow}
disabled={isPending || !currentUserId}
className="gap-2 font-semibold"
variant={followState === "accepted" ? "secondary" : "default"}
>
{followState === "accepted" ? (
<><UserMinus className="h-4 w-4" />Friends</>
) : followState === "outgoing_pending" ? (
<><Clock className="h-4 w-4" />Request Sent</>
) : (
<><UserPlus className="h-4 w-4" />Add Friend</>
)}
</Button>
<Button variant="secondary" className="gap-2 font-semibold">
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

<Separator />

{/* Profile tabs */}
<div className="flex items-center justify-between mt-1">
<div className="flex gap-0.5 overflow-x-auto">
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
<Button variant="default" size="sm" className="gap-2">
<Camera className="h-4 w-4" />
Add Your Story
</Button>
)}
<Button variant="secondary" size="icon" className="h-8 w-8">
<Search className="h-4 w-4" />
</Button>
<Button variant="secondary" size="icon" className="h-8 w-8">
<MoreHorizontal className="h-4 w-4" />
</Button>
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
<Button variant="ghost" size="sm" asChild>
<Link href="/settings">
<Pencil className="h-3.5 w-3.5 mr-1" />
Edit
</Link>
</Button>
)}
</div>
{user.bio && (
<p className="text-sm text-muted-foreground mb-3 leading-relaxed text-center">{user.bio}</p>
)}
<div className="space-y-2.5 text-sm">
{user.location && (
<p className="flex items-center gap-2 text-muted-foreground">
<MapPin className="h-4 w-4 shrink-0 text-primary" />
Live In <span className="font-semibold text-foreground">{user.location}</span>
</p>
)}
{user.website && (
<p className="flex items-center gap-2 text-muted-foreground">
<GraduationCap className="h-4 w-4 shrink-0 text-primary" />
Studied at{" "}
<a href={user.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline truncate">
{user.website.replace(/^https?:\/\//, "")}
</a>
</p>
)}
{user.website && (
<p className="flex items-center gap-2 text-muted-foreground">
<Briefcase className="h-4 w-4 shrink-0 text-primary" />
Works at <span className="font-semibold text-foreground">Envato Market</span>
</p>
)}
<p className="flex items-center gap-2 text-muted-foreground">
<Heart className="h-4 w-4 shrink-0 text-primary" />
In <span className="font-semibold text-foreground">Relationship</span>
</p>
<p className="flex items-center gap-2 text-muted-foreground">
<Radio className="h-4 w-4 shrink-0 text-primary" />
Followed By{" "}
<span className="font-semibold text-foreground">
{user._count.followers.toLocaleString()} People
</span>
</p>
{user.birthday && (
<p className="flex items-center gap-2 text-muted-foreground">
<CalendarDays className="h-4 w-4 shrink-0 text-primary" />
Born{" "}
<span className="font-semibold text-foreground">
{format(new Date(user.birthday), "MMMM d, yyyy")}
</span>
</p>
)}
</div>
{/* Interest tags */}
<div className="flex flex-wrap gap-2 mt-3">
{["Shopping", "Code", "Art", "Design"].map((tag) => (
<Badge key={tag} variant="secondary" className="rounded-full text-xs">
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
<h3 className="font-semibold">Friends</h3>
<button onClick={() => setActiveTab("Friends")} className="text-primary text-xs hover:underline">See all</button>
</div>
<p className="text-xs text-muted-foreground mb-3">{user._count.followers.toLocaleString()} friends</p>
<div className="grid grid-cols-3 gap-2">
{friends.slice(0, 9).map((f) => {
const n = displayName(f);
return (
<Link key={f.id} href={`/profile/${f.userName}`} className="group">
<div className="aspect-square rounded-lg overflow-hidden bg-muted">
<Avatar className="h-full w-full rounded-none">
<AvatarImage src={f.avatar?.photoSrc ?? undefined} className="object-cover" />
<AvatarFallback className="rounded-none bg-primary text-primary-foreground font-semibold">
{n[0]?.toUpperCase()}
</AvatarFallback>
</Avatar>
</div>
<p className="text-xs mt-1 font-medium truncate group-hover:underline">{n.split(" ")[0]}</p>
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
currentUser={{
id: user.id,
userName: user.userName,
firstName: user.firstName,
lastName: user.lastName,
avatar: user.avatar,
}}
onPost={(post) => setPosts((p) => [post as Post, ...p])}
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
{posts.map((post) => (
<PostCard key={post.id} post={post} currentUserId={currentUserId ?? 0} />
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
<p className="text-sm text-muted-foreground mb-4">
{user._count.followers.toLocaleString()} friends &middot; showing {friends.length}
</p>
<FriendGrid people={friends} />
</>
)}
</div>
)}

{(activeTab === "Photos" || activeTab === "Videos") && (
<div className="pb-10">
{!canViewContent ? (
<PrivacyGate privacy={user.profilePrivacy} />
) : (
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
{posts
.flatMap((p) => p.media)
.filter((m) => activeTab === "Photos" ? m.type === "image" : m.type === "video")
.map((m) => (
<div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
{m.type === "video" ? (
<video src={m.url} className="w-full h-full object-cover" />
) : (
<img src={m.url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" />
)}
</div>
))}
{posts.flatMap((p) => p.media).filter((m) =>
activeTab === "Photos" ? m.type === "image" : m.type === "video"
).length === 0 && (
<div className="col-span-4 text-center py-16 text-muted-foreground">
<p className="font-medium">No {activeTab.toLowerCase()} yet</p>
</div>
)}
</div>
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
<h2 className="font-semibold text-base mb-3">Groups created</h2>
<GroupGrid groups={ownedGroups} emptyLabel="No groups created" />
</section>
)}
<section>
<h2 className="font-semibold text-base mb-3">
{ownedGroups.length > 0 ? "Groups joined" : "Groups"}
</h2>
<GroupGrid
groups={groups.filter((g) => !ownedGroups.find((og) => og.id === g.id))}
emptyLabel="Not a member of any groups"
/>
</section>
</>
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
<section>
<h2 className="font-semibold text-base mb-3">Pages</h2>
<PageGrid pages={allPages} emptyLabel="No pages" />
</section>
)}
{(createdEvents.length > 0 || attendingEvents.length > 0) && (
<section>
<h2 className="font-semibold text-base mb-3">Events</h2>
<EventGrid
events={[...createdEvents, ...attendingEvents]}
emptyLabel="No events"
/>
</section>
)}
</>
)}
</div>
)}
</div>
</div>
);
}

"use client";

import {
	useState,
	useTransition,
	useEffect,
	useCallback,
	useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Search,
	Plus,
	Heart,
	ShoppingBag,
	Tag,
	Eye,
	MessageCircle,
	Bookmark,
	LayoutGrid,
	Package,
	CheckCircle2,
	Clock,
	Trash2,
	Edit2,
	TrendingUp,
	Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
	toggleSaveListing,
	deleteListing,
	markAsSold,
	fetchListingsPage,
} from "@/actions/marketplace.actions";
import { CreateListingDialog } from "@/components/marketplace/CreateListingDialog";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

const CATEGORIES = [
	"All",
	"Electronics",
	"Clothing",
	"Furniture",
	"Vehicles",
	"Books",
	"HomeGarden",
	"Sports",
	"Toys",
	"Art",
	"Food",
	"Services",
	"Other",
] as const;

const CATEGORY_ICONS: Record<string, string> = {
	All: "🛍️",
	Electronics: "📱",
	Clothing: "👗",
	Furniture: "🛋️",
	Vehicles: "🚗",
	Books: "📚",
	HomeGarden: "🌿",
	Sports: "⚽",
	Toys: "🧸",
	Art: "🎨",
	Food: "🍎",
	Services: "🔧",
	Other: "📦",
};

export type Listing = {
	id: number;
	title: string;
	description: string;
	price: number;
	isFree: boolean;
	category: string;
	condition: string;
	status: string;
	location: string | null;
	slug: string;
	viewCount: number;
	createdAt: Date;
	seller: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	images: { url: string; order: number }[];
	saves: { id: number }[];
	_count: { saves: number; offers: number };
};

export type MyListing = Listing & {
	_count: { saves: number; offers: number; messages: number };
};

function displayName(u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) {
	return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;
}

function ListingCard({
	listing,
	currentUserId,
	onSaveToggle,
}: {
	listing: Listing;
	currentUserId: number;
	onSaveToggle?: (id: number, saved: boolean) => void;
}) {
	const [saved, setSaved] = useState(listing.saves.length > 0);
	const [, startTransition] = useTransition();
	const coverImg = listing.images[0]?.url;
	const isMine = listing.seller.id === currentUserId;

	const handleSave = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const next = !saved;
		setSaved(next);
		startTransition(async () => {
			try {
				await toggleSaveListing(listing.id);
				onSaveToggle?.(listing.id, next);
			} catch {
				setSaved(!next);
				toast.error("Failed to save listing");
			}
		});
	};

	return (
		<Link href={`/marketplace/${listing.slug}`} className="group block">
			<Card className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full border-border/50 hover:border-primary/30">
				{/* Image */}
				<div className="relative h-48 bg-gradient-to-br from-muted/80 to-muted overflow-hidden">
					{coverImg ? (
						<Image
							src={coverImg}
							alt={listing.title}
							fill
							className="object-cover group-hover:scale-105 transition-transform duration-300"
							sizes="300px"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<span className="text-5xl opacity-40">
								{CATEGORY_ICONS[listing.category] ?? "📦"}
							</span>
						</div>
					)}
					{/* Status badge */}
					{listing.status !== "Active" && (
						<div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
							<Badge
								variant="secondary"
								className="text-sm font-semibold"
							>
								{listing.status}
							</Badge>
						</div>
					)}
					{/* Save button */}
					{!isMine && (
						<button
							onClick={handleSave}
							className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md ${
								saved
									? "bg-rose-500 text-white"
									: "bg-background/80 backdrop-blur text-muted-foreground hover:text-rose-500"
							}`}
						>
							<Heart
								className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
							/>
						</button>
					)}
					{/* Category chip */}
					<div className="absolute bottom-2 left-2">
						<Badge className="text-[10px] bg-background/80 backdrop-blur text-foreground border-0">
							{CATEGORY_ICONS[listing.category]}{" "}
							{listing.category}
						</Badge>
					</div>
				</div>

				<CardContent className="p-3">
					<p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-1">
						{listing.title}
					</p>
					<div className="flex items-center justify-between">
						<span className="text-base font-bold text-primary">
							{listing.isFree ? (
								<span className="text-green-500">Free</span>
							) : (
								`$${listing.price.toFixed(2)}`
							)}
						</span>
						<Badge variant="outline" className="text-[10px]">
							{listing.condition}
						</Badge>
					</div>
					{listing.location && (
						<p className="text-xs text-muted-foreground mt-1 truncate">
							📍 {listing.location}
						</p>
					)}
					<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
						<Avatar className="h-5 w-5 shrink-0">
							<AvatarImage
								src={
									listing.seller.avatar?.photoSrc ?? undefined
								}
							/>
							<AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
								{displayName(listing.seller)[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<span className="truncate">
							{displayName(listing.seller)}
						</span>
						<span className="ml-auto">
							{format(new Date(listing.createdAt), "MMM d")}
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

function MyListingCard({
	listing,
	onDelete,
	onMarkSold,
}: {
	listing: MyListing;
	onDelete: (id: number) => void;
	onMarkSold: (id: number) => void;
}) {
	const [, startTransition] = useTransition();
	const coverImg = listing.images[0]?.url;

	const handleDelete = (e: React.MouseEvent) => {
		e.preventDefault();
		startTransition(async () => {
			try {
				await deleteListing(listing.id);
				onDelete(listing.id);
				toast.success("Listing removed");
			} catch {
				toast.error("Failed to delete listing");
			}
		});
	};

	const handleMarkSold = (e: React.MouseEvent) => {
		e.preventDefault();
		startTransition(async () => {
			try {
				await markAsSold(listing.id);
				onMarkSold(listing.id);
				toast.success("Marked as sold!");
			} catch {
				toast.error("Failed to update");
			}
		});
	};

	const statusColor =
		listing.status === "Active"
			? "bg-green-500/10 text-green-600"
			: listing.status === "Sold"
				? "bg-blue-500/10 text-blue-600"
				: "bg-amber-500/10 text-amber-600";

	return (
		<Card className="overflow-hidden border-border/50">
			<div className="flex gap-0">
				{/* Image */}
				<Link
					href={`/marketplace/${listing.slug}`}
					className="relative w-28 h-28 shrink-0 bg-muted overflow-hidden"
				>
					{coverImg ? (
						<Image
							src={coverImg}
							alt={listing.title}
							fill
							className="object-cover"
							sizes="112px"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-3xl">
							{CATEGORY_ICONS[listing.category] ?? "📦"}
						</div>
					)}
				</Link>
				{/* Info */}
				<div className="flex-1 p-3 min-w-0">
					<div className="flex items-start gap-2">
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-sm truncate">
								{listing.title}
							</p>
							<p className="text-base font-bold text-primary">
								{listing.isFree ? (
									<span className="text-green-500">Free</span>
								) : (
									`$${listing.price.toFixed(2)}`
								)}
							</p>
						</div>
						<span
							className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}
						>
							{listing.status}
						</span>
					</div>
					<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
						<span className="flex items-center gap-1">
							<Eye className="h-3 w-3" />
							{listing.viewCount}
						</span>
						<span className="flex items-center gap-1">
							<Heart className="h-3 w-3" />
							{listing._count.saves}
						</span>
						<span className="flex items-center gap-1">
							<Tag className="h-3 w-3" />
							{listing._count.offers} offers
						</span>
						<span className="flex items-center gap-1">
							<MessageCircle className="h-3 w-3" />
							{listing._count.messages}
						</span>
					</div>
					<div className="flex items-center gap-1.5 mt-2">
						<Link href={`/marketplace/${listing.slug}`}>
							<Button
								size="sm"
								variant="outline"
								className="h-6 text-xs px-2 gap-1"
							>
								<Eye className="h-3 w-3" /> View
							</Button>
						</Link>
						{listing.status === "Active" && (
							<Button
								size="sm"
								variant="outline"
								className="h-6 text-xs px-2 gap-1 text-green-600"
								onClick={handleMarkSold}
							>
								<CheckCircle2 className="h-3 w-3" /> Mark sold
							</Button>
						)}
						<Button
							size="sm"
							variant="outline"
							className="h-6 text-xs px-2 gap-1 text-destructive ml-auto"
							onClick={handleDelete}
						>
							<Trash2 className="h-3 w-3" /> Delete
						</Button>
					</div>
				</div>
			</div>
		</Card>
	);
}

export function MarketplaceClient({
	initialListings,
	myListings: initialMyListings,
	savedListings: initialSavedListings,
	currentUser,
	currentUserId,
	initialTab,
	initialCategory,
	initialSearch,
}: {
	initialListings: Listing[];
	myListings: MyListing[];
	savedListings: Listing[];
	currentUser: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	currentUserId: number;
	initialTab: string;
	initialCategory: string;
	initialSearch: string;
}) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState(initialTab);
	const [category, setCategory] = useState(initialCategory);
	const [search, setSearch] = useState(initialSearch);
	const [listings, setListings] = useState<Listing[]>(initialListings);
	const [myListings, setMyListings] =
		useState<MyListing[]>(initialMyListings);
	const [savedListings, setSavedListings] =
		useState<Listing[]>(initialSavedListings);
	const [createOpen, setCreateOpen] = useState(false);
	const [sortBy, setSortBy] = useState<
		"newest" | "price_low" | "price_high" | "most_saved"
	>("newest");
	const [hasMore, setHasMore] = useState(initialListings.length >= 24);
	const [loadingMore, setLoadingMore] = useState(false);
	const [cursor, setCursor] = useState<number | null>(
		initialListings.length > 0
			? initialListings[initialListings.length - 1].id
			: null,
	);

	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore || !cursor) return;
		setLoadingMore(true);
		try {
			const result = await fetchListingsPage({
				category: category !== "All" ? category : undefined,
				search: search || undefined,
				cursor,
			});
			setListings((prev) => [...prev, ...(result.items as Listing[])]);
			setHasMore(result.hasMore);
			setCursor(result.nextCursor);
		} catch {
			toast.error("Failed to load more listings");
		} finally {
			setLoadingMore(false);
		}
	}, [loadingMore, hasMore, cursor, category, search]);

	const sentinelRef = useInfiniteScroll(loadMore, {
		hasMore,
		loading: loadingMore,
	});

	const sortedListings = useMemo(() => {
		const sorted = [...listings];
		switch (sortBy) {
			case "price_low":
				return sorted.sort((a, b) => a.price - b.price);
			case "price_high":
				return sorted.sort((a, b) => b.price - a.price);
			case "most_saved":
				return sorted.sort((a, b) => b._count.saves - a._count.saves);
			default:
				return sorted.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime(),
				);
		}
	}, [listings, sortBy]);

	// Sync state when server re-renders with new filtered props
	useEffect(() => {
		setListings(initialListings);
		setHasMore(initialListings.length >= 24);
		setCursor(
			initialListings.length > 0
				? initialListings[initialListings.length - 1].id
				: null,
		);
	}, [initialListings]);

	useEffect(() => {
		setCategory(initialCategory);
	}, [initialCategory]);

	useEffect(() => {
		setSearch(initialSearch);
	}, [initialSearch]);

	const handleCategoryChange = (cat: string) => {
		setCategory(cat);
		const params = new URLSearchParams();
		if (cat !== "All") params.set("category", cat);
		if (search) params.set("search", search);
		router.push(`/marketplace?${params.toString()}`);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		const params = new URLSearchParams();
		if (category !== "All") params.set("category", category);
		if (search) params.set("search", search);
		router.push(`/marketplace?${params.toString()}`);
	};

	const handleSaveToggle = (id: number, saved: boolean) => {
		if (saved) {
			const listing = listings.find((l) => l.id === id);
			if (listing && !savedListings.find((sl) => sl.id === id)) {
				setSavedListings((prev) => [listing, ...prev]);
			}
		} else {
			setSavedListings((prev) => prev.filter((l) => l.id !== id));
		}
	};

	const tabs = [
		{ id: "browse", label: "Browse", icon: LayoutGrid },
		{ id: "my", label: "My Listings", icon: Package },
		{ id: "saved", label: "Saved", icon: Bookmark },
	];

	return (
		<div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<ShoppingBag className="h-6 w-6 text-primary" />
						Marketplace
					</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Buy and sell within your community
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)} className="gap-2">
					<Plus className="h-4 w-4" />
					Sell something
				</Button>
			</div>

			{/* Tabs */}
			<div className="flex items-center gap-1 border-b">
				{tabs.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						onClick={() => setActiveTab(id)}
						className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
							activeTab === id
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						<Icon className="h-4 w-4" />
						{label}
						{id === "my" && myListings.length > 0 && (
							<span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
								{myListings.length}
							</span>
						)}
						{id === "saved" && savedListings.length > 0 && (
							<span className="ml-1 text-xs bg-rose-500/10 text-rose-500 rounded-full px-1.5 py-0.5">
								{savedListings.length}
							</span>
						)}
					</button>
				))}
			</div>

			{activeTab === "browse" && (
				<>
					{/* Search bar */}
					<form onSubmit={handleSearch} className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search listings..."
							className="pl-9"
						/>
					</form>

					{/* Category pills */}
					<div className="flex items-center justify-between gap-3">
						<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
							{CATEGORIES.map((cat) => (
								<button
									key={cat}
									onClick={() => handleCategoryChange(cat)}
									className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border ${
										category === cat
											? "bg-primary text-primary-foreground border-primary"
											: "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
									}`}
								>
									<span>{CATEGORY_ICONS[cat]}</span>
									<span>
										{cat === "HomeGarden"
											? "Home & Garden"
											: cat}
									</span>
								</button>
							))}
						</div>
						<Select
							value={sortBy}
							onValueChange={(v) => setSortBy(v as typeof sortBy)}
						>
							<SelectTrigger className="w-40 h-9 text-sm shrink-0">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">
									Newest first
								</SelectItem>
								<SelectItem value="price_low">
									Price: low → high
								</SelectItem>
								<SelectItem value="price_high">
									Price: high → low
								</SelectItem>
								<SelectItem value="most_saved">
									Most saved
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Listings grid */}
					{sortedListings.length === 0 ? (
						<div className="text-center py-20 text-muted-foreground">
							<ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
							<p className="font-semibold text-base">
								No listings found
							</p>
							<p className="text-sm mt-1">
								{search
									? `No results for "${search}"`
									: "Be the first to sell something!"}
							</p>
							<Button
								className="mt-4 gap-2"
								onClick={() => setCreateOpen(true)}
							>
								<Plus className="h-4 w-4" />
								Create listing
							</Button>
						</div>
					) : (
						<>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
								{sortedListings.map((listing) => (
									<ListingCard
										key={listing.id}
										listing={listing}
										currentUserId={currentUserId}
										onSaveToggle={handleSaveToggle}
									/>
								))}
							</div>
							{hasMore && (
								<div
									ref={sentinelRef}
									className="flex justify-center py-6"
								>
									{loadingMore && (
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									)}
								</div>
							)}
						</>
					)}
				</>
			)}

			{activeTab === "my" && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-semibold text-lg">
								My Listings
							</h2>
							<p className="text-sm text-muted-foreground">
								{
									myListings.filter(
										(l) => l.status === "Active",
									).length
								}{" "}
								active ·{" "}
								{
									myListings.filter(
										(l) => l.status === "Sold",
									).length
								}{" "}
								sold
							</p>
						</div>
						<Button
							size="sm"
							onClick={() => setCreateOpen(true)}
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							New listing
						</Button>
					</div>

					{/* Stats row */}
					{myListings.length > 0 && (
						<div className="grid grid-cols-4 gap-3">
							{[
								{
									label: "Total views",
									value: myListings.reduce(
										(s, l) => s + l.viewCount,
										0,
									),
									icon: Eye,
									color: "text-blue-500",
								},
								{
									label: "Total saves",
									value: myListings.reduce(
										(s, l) => s + l._count.saves,
										0,
									),
									icon: Heart,
									color: "text-rose-500",
								},
								{
									label: "Offers received",
									value: myListings.reduce(
										(s, l) => s + l._count.offers,
										0,
									),
									icon: Tag,
									color: "text-amber-500",
								},
								{
									label: "Items sold",
									value: myListings.filter(
										(l) => l.status === "Sold",
									).length,
									icon: TrendingUp,
									color: "text-green-500",
								},
							].map(({ label, value, icon: Icon, color }) => (
								<Card key={label} className="border-border/50">
									<CardContent className="pt-4 pb-4 text-center">
										<Icon
											className={`h-5 w-5 mx-auto mb-1 ${color}`}
										/>
										<p className="text-xl font-bold">
											{value}
										</p>
										<p className="text-xs text-muted-foreground">
											{label}
										</p>
									</CardContent>
								</Card>
							))}
						</div>
					)}

					{myListings.length === 0 ? (
						<div className="text-center py-16 text-muted-foreground">
							<Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
							<p className="font-medium">No listings yet</p>
							<Button
								className="mt-4 gap-2"
								onClick={() => setCreateOpen(true)}
							>
								<Plus className="h-4 w-4" />
								Create your first listing
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							{myListings.map((listing) => (
								<MyListingCard
									key={listing.id}
									listing={listing}
									onDelete={(id) =>
										setMyListings((prev) =>
											prev.filter((l) => l.id !== id),
										)
									}
									onMarkSold={(id) =>
										setMyListings((prev) =>
											prev.map((l) =>
												l.id === id
													? { ...l, status: "Sold" }
													: l,
											),
										)
									}
								/>
							))}
						</div>
					)}
				</div>
			)}

			{activeTab === "saved" && (
				<div className="space-y-4">
					<h2 className="font-semibold text-lg">
						Saved Listings{" "}
						{savedListings.length > 0 && (
							<span className="text-sm font-normal text-muted-foreground">
								({savedListings.length})
							</span>
						)}
					</h2>
					{savedListings.length === 0 ? (
						<div className="text-center py-16 text-muted-foreground">
							<Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
							<p className="font-medium">No saved listings</p>
							<p className="text-sm mt-1">
								Save items you&apos;re interested in
							</p>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
							{savedListings.map((listing) => (
								<ListingCard
									key={listing.id}
									listing={listing}
									currentUserId={currentUserId}
									onSaveToggle={(id, saved) => {
										if (!saved)
											setSavedListings((prev) =>
												prev.filter((l) => l.id !== id),
											);
									}}
								/>
							))}
						</div>
					)}
				</div>
			)}

			<CreateListingDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				currentUser={currentUser}
				onCreated={(listing: MyListing) => {
					setMyListings((prev) => [listing as MyListing, ...prev]);
					toast.success("Listing created!");
					setActiveTab("my");
				}}
			/>
		</div>
	);
}

"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Heart,
	MapPin,
	Eye,
	Tag,
	ChevronLeft,
	ChevronRight,
	MessageCircle,
	Send,
	CheckCircle2,
	Clock,
	ArrowLeft,
	Bookmark,
	Share2,
	Flag,
	Package,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
	toggleSaveListing,
	makeOffer,
	sendListingMessage,
	respondToOffer,
	toggleListingMessageLike,
} from "@/actions/marketplace.actions";

const CATEGORY_ICONS: Record<string, string> = {
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

const CONDITION_LABELS: Record<string, string> = {
	New: "New",
	LikeNew: "Like New",
	Good: "Good",
	Fair: "Fair",
	Poor: "Poor",
};

type Seller = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
	_count: { listings: number };
};

type Message = {
	id: number;
	content: string;
	createdAt: Date;
	isLiked: boolean;
	likeCount: number;
	sender: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};

type RawMessage = {
	id: number;
	content: string;
	createdAt: Date;
	likes: { id: number }[];
	_count: { likes: number };
	sender: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};

type Offer = {
	id: number;
	amount: number;
	message: string | null;
	status: string;
	createdAt: Date;
	buyer: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
};

type Listing = {
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
	seller: Seller;
	images: { url: string; order: number }[];
	saves: { id: number }[];
	offers: Offer[];
	messages: RawMessage[];
	_count: { saves: number };
};

function displayName(u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) {
	return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;
}

function ImageGallery({
	images,
	title,
}: {
	images: { url: string }[];
	title: string;
}) {
	const [active, setActive] = useState(0);

	if (images.length === 0) {
		return (
			<div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
				<Package className="h-20 w-20 text-muted-foreground/30" />
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
				<Image
					src={images[active].url}
					alt={title}
					fill
					className="object-contain"
					sizes="600px"
					priority
				/>
				{images.length > 1 && (
					<>
						<button
							onClick={() =>
								setActive((p) =>
									p === 0 ? images.length - 1 : p - 1,
								)
							}
							className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow hover:bg-background"
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<button
							onClick={() =>
								setActive((p) =>
									p === images.length - 1 ? 0 : p + 1,
								)
							}
							className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow hover:bg-background"
						>
							<ChevronRight className="h-4 w-4" />
						</button>
						<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
							{images.map((_, i) => (
								<button
									key={i}
									onClick={() => setActive(i)}
									className={`w-1.5 h-1.5 rounded-full transition-colors ${
										i === active
											? "bg-primary"
											: "bg-white/60"
									}`}
								/>
							))}
						</div>
					</>
				)}
			</div>
			{images.length > 1 && (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{images.map((img, i) => (
						<button
							key={i}
							onClick={() => setActive(i)}
							className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
								i === active
									? "border-primary"
									: "border-transparent"
							}`}
						>
							<Image
								src={img.url}
								alt=""
								fill
								className="object-cover"
								sizes="56px"
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function ListingDetailClient({
	listing: initialListing,
	relatedListings,
	currentUserId,
}: {
	listing: Listing;
	relatedListings: Listing[];
	currentUserId: number;
}) {
	const router = useRouter();
	const [listing, setListing] = useState(initialListing);
	const [saved, setSaved] = useState(initialListing.saves.length > 0);
	const [messages, setMessages] = useState<Message[]>(
		initialListing.messages.map((m) => ({
			...m,
			isLiked: m.likes.length > 0,
			likeCount: m._count.likes,
		})),
	);
	const [offers, setOffers] = useState<Offer[]>(initialListing.offers);
	const [msgText, setMsgText] = useState("");
	const [offerOpen, setOfferOpen] = useState(false);
	const [offerAmount, setOfferAmount] = useState("");
	const [offerMsg, setOfferMsg] = useState("");
	const [, startTransition] = useTransition();
	const msgRef = useRef<HTMLInputElement>(null);

	const isMine = listing.seller.id === currentUserId;
	const myOffer = offers.find((o) => o.buyer.id === currentUserId);

	const handleToggleMessageLike = (messageId: number) => {
		setMessages((prev) =>
			prev.map((m) => {
				if (m.id !== messageId) return m;
				const nextLiked = !m.isLiked;
				return {
					...m,
					isLiked: nextLiked,
					likeCount: m.likeCount + (nextLiked ? 1 : -1),
				};
			}),
		);
		startTransition(async () => {
			try {
				await toggleListingMessageLike(messageId);
			} catch {
				// Revert on error
				setMessages((prev) =>
					prev.map((m) => {
						if (m.id !== messageId) return m;
						const reverted = !m.isLiked;
						return {
							...m,
							isLiked: reverted,
							likeCount: m.likeCount + (reverted ? 1 : -1),
						};
					}),
				);
				toast.error("Failed to like message");
			}
		});
	};

	const handleSave = () => {
		const next = !saved;
		setSaved(next);
		startTransition(async () => {
			try {
				await toggleSaveListing(listing.id);
			} catch {
				setSaved(!next);
				toast.error("Failed");
			}
		});
	};

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!msgText.trim()) return;
		const content = msgText.trim();
		setMsgText("");
		startTransition(async () => {
			try {
				const msg = await sendListingMessage(listing.id, content);
				setMessages((prev) => [
					...prev,
					{
						id: msg.id,
						content: msg.content,
						createdAt: msg.createdAt,
						isLiked: false,
						likeCount: 0,
						sender: msg.sender,
					},
				]);
			} catch {
				toast.error("Failed to send message");
			}
		});
	};

	const handleOffer = () => {
		const amount = parseFloat(offerAmount);
		if (!amount || amount <= 0) {
			toast.warning("Enter a valid offer amount");
			return;
		}
		startTransition(async () => {
			try {
				const offer = await makeOffer(
					listing.id,
					amount,
					offerMsg || undefined,
				);
				setOffers((prev) => [offer as unknown as Offer, ...prev]);
				setOfferOpen(false);
				setOfferAmount("");
				setOfferMsg("");
				toast.success("Offer sent!");
			} catch (e) {
				toast.error(
					e instanceof Error ? e.message : "Failed to make offer",
				);
			}
		});
	};

	const handleRespondOffer = (
		offerId: number,
		action: "Accepted" | "Declined",
	) => {
		startTransition(async () => {
			try {
				await respondToOffer(offerId, action);
				setOffers((prev) =>
					prev.map((o) =>
						o.id === offerId ? { ...o, status: action } : o,
					),
				);
				if (action === "Accepted") {
					setListing((prev) => ({ ...prev, status: "Reserved" }));
					toast.success("Offer accepted! Item is now reserved.");
				} else {
					toast.success("Offer declined.");
				}
			} catch {
				toast.error("Failed to respond to offer");
			}
		});
	};

	const statusBadge =
		listing.status === "Active"
			? {
					label: "Active",
					classes: "bg-green-500/10 text-green-600 border-green-200",
				}
			: listing.status === "Sold"
				? {
						label: "Sold",
						classes: "bg-blue-500/10 text-blue-600 border-blue-200",
					}
				: {
						label: listing.status,
						classes:
							"bg-amber-500/10 text-amber-600 border-amber-200",
					};

	return (
		<div className="max-w-5xl mx-auto px-4 py-6">
			{/* Back */}
			<button
				onClick={() => router.back()}
				className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Marketplace
			</button>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left: Photos */}
				<div>
					<ImageGallery
						images={listing.images}
						title={listing.title}
					/>
				</div>

				{/* Right: Details */}
				<div className="space-y-5">
					{/* Title + status */}
					<div>
						<div className="flex items-start gap-2 mb-1">
							<h1 className="text-xl font-bold flex-1 leading-tight">
								{listing.title}
							</h1>
							<Badge
								variant="outline"
								className={`shrink-0 text-xs ${statusBadge.classes}`}
							>
								{statusBadge.label}
							</Badge>
						</div>
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<Eye className="h-3 w-3" />
								{listing.viewCount} views
							</span>
							<span className="flex items-center gap-1">
								<Heart className="h-3 w-3" />
								{listing._count.saves} saves
							</span>
							<span className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								{format(
									new Date(listing.createdAt),
									"MMM d, yyyy",
								)}
							</span>
						</div>
					</div>

					{/* Price */}
					<div className="flex items-center gap-3">
						<span className="text-3xl font-bold text-primary">
							{listing.isFree ? (
								<span className="text-green-500">Free</span>
							) : (
								`$${listing.price.toFixed(2)}`
							)}
						</span>
						<div className="flex gap-2">
							<Badge variant="outline" className="text-xs">
								{CATEGORY_ICONS[listing.category]}{" "}
								{listing.category}
							</Badge>
							<Badge variant="outline" className="text-xs">
								{CONDITION_LABELS[listing.condition] ??
									listing.condition}
							</Badge>
						</div>
					</div>

					{/* Location */}
					{listing.location && (
						<p className="text-sm text-muted-foreground flex items-center gap-1.5">
							<MapPin className="h-4 w-4 shrink-0" />
							{listing.location}
						</p>
					)}

					{/* Description */}
					<div>
						<h3 className="font-semibold mb-1.5 text-sm">
							Description
						</h3>
						<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
							{listing.description}
						</p>
					</div>

					<Separator />

					{/* Seller card */}
					<div className="flex items-center gap-3">
						<Link href={`/profile/${listing.seller.userName}`}>
							<Avatar className="h-11 w-11 ring-2 ring-primary/20">
								<AvatarImage
									src={
										listing.seller.avatar?.photoSrc ??
										undefined
									}
								/>
								<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
									{displayName(
										listing.seller,
									)[0]?.toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</Link>
						<div className="flex-1 min-w-0">
							<Link
								href={`/profile/${listing.seller.userName}`}
								className="font-semibold text-sm hover:underline"
							>
								{displayName(listing.seller)}
							</Link>
							<p className="text-xs text-muted-foreground">
								{listing.seller._count.listings} active listing
								{listing.seller._count.listings !== 1
									? "s"
									: ""}
							</p>
						</div>
						<Link href={`/profile/${listing.seller.userName}`}>
							<Button size="sm" variant="outline">
								View profile
							</Button>
						</Link>
					</div>

					{/* Actions */}
					{!isMine && listing.status === "Active" && (
						<div className="flex gap-2">
							<Button
								variant={saved ? "default" : "outline"}
								size="icon"
								onClick={handleSave}
								className={
									saved
										? "bg-rose-500 hover:bg-rose-600 border-rose-500"
										: ""
								}
								title={saved ? "Unsave" : "Save"}
							>
								<Heart
									className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
								/>
							</Button>
							<Button
								variant="outline"
								className="gap-2 flex-1"
								onClick={() => setOfferOpen(true)}
								disabled={
									!!myOffer && myOffer.status === "Pending"
								}
							>
								<Tag className="h-4 w-4" />
								{myOffer
									? myOffer.status === "Pending"
										? `Offer pending ($${myOffer.amount})`
										: `Make another offer`
									: "Make an offer"}
							</Button>
						</div>
					)}

					{isMine && (
						<Button
							variant="outline"
							className="w-full gap-2"
							disabled={listing.status !== "Active"}
							onClick={() => {
								startTransition(async () => {
									const { markAsSold } =
										await import("@/actions/marketplace.actions");
									await markAsSold(listing.id);
									setListing((prev) => ({
										...prev,
										status: "Sold",
									}));
									toast.success("Marked as sold!");
								});
							}}
						>
							<CheckCircle2 className="h-4 w-4" />
							Mark as Sold
						</Button>
					)}
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Messages */}
				<div className="space-y-3">
					<h2 className="font-semibold flex items-center gap-2">
						<MessageCircle className="h-4 w-4" />
						Messages
						{messages.length > 0 && (
							<span className="text-xs text-muted-foreground font-normal">
								({messages.length})
							</span>
						)}
					</h2>

					{messages.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-6">
							No messages yet. Ask the seller a question!
						</p>
					) : (
						<div className="space-y-3 max-h-72 overflow-y-auto pr-1">
							{messages.map((msg) => {
								const isMe = msg.sender.id === currentUserId;
								return (
									<div
										key={msg.id}
										className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
									>
										<Avatar className="h-7 w-7 shrink-0">
											<AvatarImage
												src={
													msg.sender.avatar
														?.photoSrc ?? undefined
												}
											/>
											<AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
												{displayName(
													msg.sender,
												)[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div
											className={`max-w-[75%] ${isMe ? "items-end" : ""} flex flex-col`}
										>
											<div
												className={`rounded-2xl px-3 py-2 text-sm ${
													isMe
														? "bg-primary text-primary-foreground rounded-tr-sm"
														: "bg-muted rounded-tl-sm"
												}`}
											>
												{msg.content}
											</div>
											<div
												className={`flex items-center gap-2 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}
											>
												<span className="text-[10px] text-muted-foreground">
													{format(
														new Date(msg.createdAt),
														"MMM d, h:mm a",
													)}
												</span>
												<button
													onClick={() =>
														handleToggleMessageLike(
															msg.id,
														)
													}
													className={`flex items-center gap-0.5 text-[10px] transition-colors ${msg.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
												>
													<Heart
														className={`h-3 w-3 ${msg.isLiked ? "fill-red-500" : ""}`}
													/>
													{msg.likeCount > 0 && (
														<span>
															{msg.likeCount}
														</span>
													)}
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{!isMine && listing.status === "Active" && (
						<form
							onSubmit={handleSendMessage}
							className="flex gap-2"
						>
							<Input
								ref={msgRef}
								value={msgText}
								onChange={(e) => setMsgText(e.target.value)}
								placeholder="Ask a question..."
								className="flex-1"
							/>
							<Button
								type="submit"
								size="icon"
								disabled={!msgText.trim()}
							>
								<Send className="h-4 w-4" />
							</Button>
						</form>
					)}

					{isMine && messages.length > 0 && (
						<form
							onSubmit={handleSendMessage}
							className="flex gap-2"
						>
							<Input
								value={msgText}
								onChange={(e) => setMsgText(e.target.value)}
								placeholder="Reply..."
								className="flex-1"
							/>
							<Button
								type="submit"
								size="icon"
								disabled={!msgText.trim()}
							>
								<Send className="h-4 w-4" />
							</Button>
						</form>
					)}
				</div>

				{/* Offers (visible to seller + buyer) */}
				{(isMine ||
					offers.some((o) => o.buyer.id === currentUserId)) && (
					<div className="space-y-3">
						<h2 className="font-semibold flex items-center gap-2">
							<Tag className="h-4 w-4" />
							Offers
							{offers.length > 0 && (
								<span className="text-xs text-muted-foreground font-normal">
									({offers.length})
								</span>
							)}
						</h2>

						{offers.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-6">
								No offers yet.
							</p>
						) : (
							<div className="space-y-2">
								{offers
									.filter(
										(o) =>
											isMine ||
											o.buyer.id === currentUserId,
									)
									.map((offer) => {
										const offerBadge =
											offer.status === "Pending"
												? "bg-amber-500/10 text-amber-600"
												: offer.status === "Accepted"
													? "bg-green-500/10 text-green-600"
													: "bg-muted text-muted-foreground";

										return (
											<Card
												key={offer.id}
												className="border-border/50"
											>
												<CardContent className="pt-3 pb-3">
													<div className="flex items-start gap-3">
														<Avatar className="h-8 w-8 shrink-0">
															<AvatarImage
																src={
																	offer.buyer
																		.avatar
																		?.photoSrc ??
																	undefined
																}
															/>
															<AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
																{displayName(
																	offer.buyer,
																)[0]?.toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2">
																<span className="font-semibold text-sm">
																	{offer.buyer
																		.id ===
																	currentUserId
																		? "Your offer"
																		: displayName(
																				offer.buyer,
																			)}
																</span>
																<span
																	className={`text-xs px-2 py-0.5 rounded-full font-medium ${offerBadge}`}
																>
																	{
																		offer.status
																	}
																</span>
															</div>
															<p className="text-base font-bold text-primary">
																$
																{offer.amount.toFixed(
																	2,
																)}
															</p>
															{offer.message && (
																<p className="text-xs text-muted-foreground mt-0.5">
																	{
																		offer.message
																	}
																</p>
															)}
														</div>
													</div>
													{isMine &&
														offer.status ===
															"Pending" && (
															<div className="flex gap-2 mt-2">
																<Button
																	size="sm"
																	className="gap-1 bg-green-600 hover:bg-green-700"
																	onClick={() =>
																		handleRespondOffer(
																			offer.id,
																			"Accepted",
																		)
																	}
																>
																	<CheckCircle2 className="h-3.5 w-3.5" />
																	Accept
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	className="gap-1"
																	onClick={() =>
																		handleRespondOffer(
																			offer.id,
																			"Declined",
																		)
																	}
																>
																	Decline
																</Button>
															</div>
														)}
												</CardContent>
											</Card>
										);
									})}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Related listings */}
			{relatedListings.length > 0 && (
				<div className="mt-10">
					<h2 className="font-bold text-lg mb-4">Similar listings</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{relatedListings.map((l) => (
							<Link
								key={l.id}
								href={`/marketplace/${l.slug}`}
								className="group block"
							>
								<Card className="overflow-hidden hover:shadow-md transition-shadow h-full border-border/50">
									<div className="relative h-32 bg-muted overflow-hidden">
										{l.images[0] ? (
											<Image
												src={l.images[0].url}
												alt={l.title}
												fill
												className="object-cover group-hover:scale-105 transition-transform duration-300"
												sizes="200px"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-3xl opacity-40">
												{CATEGORY_ICONS[l.category] ??
													"📦"}
											</div>
										)}
									</div>
									<CardContent className="p-2">
										<p className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors">
											{l.title}
										</p>
										<p className="text-sm font-bold text-primary mt-0.5">
											{l.isFree ? (
												<span className="text-green-500">
													Free
												</span>
											) : (
												`$${l.price.toFixed(2)}`
											)}
										</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Make Offer Dialog */}
			<Dialog open={offerOpen} onOpenChange={setOfferOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Make an offer</DialogTitle>
						<DialogDescription>
							Listed at{" "}
							<span className="font-semibold text-primary">
								{listing.isFree
									? "Free"
									: `$${listing.price.toFixed(2)}`}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<label className="text-sm font-medium">
								Your offer
							</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
									$
								</span>
								<Input
									type="number"
									min="0"
									step="0.01"
									value={offerAmount}
									onChange={(e) =>
										setOfferAmount(e.target.value)
									}
									placeholder="0.00"
									className="pl-7"
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-medium">
								Message (optional)
							</label>
							<Textarea
								value={offerMsg}
								onChange={(e) => setOfferMsg(e.target.value)}
								placeholder="Tell the seller why they should accept..."
								className="resize-none min-h-[80px]"
								maxLength={300}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOfferOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleOffer}
							disabled={
								!offerAmount || parseFloat(offerAmount) <= 0
							}
						>
							Send offer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

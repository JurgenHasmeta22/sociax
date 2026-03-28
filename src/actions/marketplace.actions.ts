"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSessionUserId(): Promise<number> {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Not authenticated");
	return parseInt(session.user.id);
}

function generateSlug(title: string, id: number) {
	return (
		title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 60) +
		"-" +
		id
	);
}

export async function createListing(data: {
	title: string;
	description: string;
	price: number;
	isFree: boolean;
	category: string;
	condition: string;
	location?: string;
	imageUrls: string[];
}) {
	const sellerId = await getSessionUserId();

	const listing = await prisma.marketplaceListing.create({
		data: {
			title: data.title.trim(),
			description: data.description.trim(),
			price: data.isFree ? 0 : data.price,
			isFree: data.isFree,
			category: data.category as never,
			condition: data.condition as never,
			location: data.location?.trim() || null,
			slug: `listing-${Date.now()}`,
			sellerId,
			images: {
				create: data.imageUrls.map((url, i) => ({ url, order: i })),
			},
		},
	});

	// Now update with a proper slug including the ID
	await prisma.marketplaceListing.update({
		where: { id: listing.id },
		data: { slug: generateSlug(data.title, listing.id) },
	});

	revalidatePath("/marketplace");
	return listing;
}

export async function updateListing(
	listingId: number,
	data: {
		title: string;
		description: string;
		price: number;
		isFree: boolean;
		category: string;
		condition: string;
		location?: string;
		imageUrls: string[];
	},
) {
	const sellerId = await getSessionUserId();
	const listing = await prisma.marketplaceListing.findUnique({
		where: { id: listingId },
		select: { sellerId: true },
	});
	if (!listing || listing.sellerId !== sellerId)
		throw new Error("Not authorized");

	await prisma.$transaction([
		prisma.listingImage.deleteMany({ where: { listingId } }),
		prisma.marketplaceListing.update({
			where: { id: listingId },
			data: {
				title: data.title.trim(),
				description: data.description.trim(),
				price: data.isFree ? 0 : data.price,
				isFree: data.isFree,
				category: data.category as never,
				condition: data.condition as never,
				location: data.location?.trim() || null,
				slug: generateSlug(data.title, listingId),
			},
		}),
	]);

	if (data.imageUrls.length > 0) {
		await prisma.listingImage.createMany({
			data: data.imageUrls.map((url, i) => ({
				url,
				order: i,
				listingId,
			})),
		});
	}

	revalidatePath("/marketplace");
	revalidatePath(`/marketplace/${generateSlug(data.title, listingId)}`);
}

export async function deleteListing(listingId: number) {
	const sellerId = await getSessionUserId();
	const listing = await prisma.marketplaceListing.findUnique({
		where: { id: listingId },
		select: { sellerId: true },
	});
	if (!listing || listing.sellerId !== sellerId)
		throw new Error("Not authorized");

	await prisma.marketplaceListing.delete({ where: { id: listingId } });
	revalidatePath("/marketplace");
}

export async function markAsSold(listingId: number) {
	const sellerId = await getSessionUserId();
	const listing = await prisma.marketplaceListing.findUnique({
		where: { id: listingId },
		select: { sellerId: true },
	});
	if (!listing || listing.sellerId !== sellerId)
		throw new Error("Not authorized");

	await prisma.marketplaceListing.update({
		where: { id: listingId },
		data: { status: "Sold" },
	});
	revalidatePath("/marketplace");
}

export async function toggleSaveListing(listingId: number) {
	const userId = await getSessionUserId();
	const existing = await prisma.listingSave.findUnique({
		where: { userId_listingId: { userId, listingId } },
	});

	if (existing) {
		await prisma.listingSave.delete({ where: { id: existing.id } });
		return { saved: false };
	} else {
		await prisma.listingSave.create({ data: { userId, listingId } });
		return { saved: true };
	}
}

export async function makeOffer(
	listingId: number,
	amount: number,
	message?: string,
) {
	const buyerId = await getSessionUserId();
	const listing = await prisma.marketplaceListing.findUnique({
		where: { id: listingId },
		select: { sellerId: true, status: true },
	});
	if (!listing) throw new Error("Listing not found");
	if (listing.status !== "Active") throw new Error("Listing is not active");
	if (listing.sellerId === buyerId)
		throw new Error("Cannot offer on your own listing");

	const offer = await prisma.listingOffer.create({
		data: { buyerId, listingId, amount, message: message?.trim() || null },
		include: {
			buyer: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
		},
	});
	return offer;
}

export async function respondToOffer(
	offerId: number,
	action: "Accepted" | "Declined",
) {
	const sellerId = await getSessionUserId();
	const offer = await prisma.listingOffer.findUnique({
		where: { id: offerId },
		include: { listing: { select: { sellerId: true } } },
	});
	if (!offer || offer.listing.sellerId !== sellerId)
		throw new Error("Not authorized");

	await prisma.listingOffer.update({
		where: { id: offerId },
		data: { status: action },
	});

	if (action === "Accepted") {
		await prisma.marketplaceListing.update({
			where: { id: offer.listingId },
			data: { status: "Reserved" },
		});
	}
	revalidatePath("/marketplace");
}

export async function sendListingMessage(listingId: number, content: string) {
	const senderId = await getSessionUserId();
	const message = await prisma.listingMessage.create({
		data: { senderId, listingId, content: content.trim() },
		include: {
			sender: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
		},
	});
	revalidatePath(`/marketplace`);
	return message;
}

export async function fetchListingsPage(opts: {
	category?: string;
	search?: string;
	cursor?: number;
	take?: number;
}) {
	const userId = await getSessionUserId();
	const take = opts.take ?? 24;
	const where: Record<string, unknown> = { status: "Active" };
	if (opts.category && opts.category !== "All") where.category = opts.category;
	if (opts.search) {
		where.OR = [
			{ title: { contains: opts.search } },
			{ description: { contains: opts.search } },
		];
	}

	const listings = await prisma.marketplaceListing.findMany({
		where: where as never,
		orderBy: { createdAt: "desc" },
		take: take + 1,
		...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
		include: {
			seller: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			images: { orderBy: { order: "asc" }, take: 1 },
			saves: { where: { userId }, select: { id: true } },
			_count: { select: { saves: true, offers: true } },
		},
	});

	const hasMore = listings.length > take;
	const items = hasMore ? listings.slice(0, take) : listings;
	return {
		items,
		hasMore,
		nextCursor: hasMore ? items[items.length - 1].id : null,
	};
}

export async function getListings(opts?: {
	category?: string;
	search?: string;
	minPrice?: number;
	maxPrice?: number;
	condition?: string;
	cursor?: number;
	take?: number;
}) {
	const take = opts?.take ?? 20;
	const where: Record<string, unknown> = { status: "Active" };

	if (opts?.category && opts.category !== "All") {
		where.category = opts.category;
	}
	if (opts?.condition && opts.condition !== "All") {
		where.condition = opts.condition;
	}
	if (opts?.search) {
		where.OR = [
			{ title: { contains: opts.search } },
			{ description: { contains: opts.search } },
		];
	}
	if (opts?.minPrice !== undefined || opts?.maxPrice !== undefined) {
		where.price = {
			...(opts.minPrice !== undefined ? { gte: opts.minPrice } : {}),
			...(opts.maxPrice !== undefined ? { lte: opts.maxPrice } : {}),
		};
	}

	const listings = await prisma.marketplaceListing.findMany({
		where: where as never,
		orderBy: { createdAt: "desc" },
		take: take + 1,
		...(opts?.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
		include: {
			seller: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			},
			images: { orderBy: { order: "asc" }, take: 1 },
			_count: { select: { saves: true, offers: true } },
		},
	});

	const hasMore = listings.length > take;
	const items = hasMore ? listings.slice(0, take) : listings;
	return {
		items,
		hasMore,
		nextCursor: hasMore ? items[items.length - 1].id : null,
	};
}

export async function getListing(slug: string) {
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const listing = await prisma.marketplaceListing.findUnique({
		where: { slug },
		include: {
			seller: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
					_count: {
						select: { listings: { where: { status: "Active" } } },
					},
				},
			},
			images: { orderBy: { order: "asc" } },
			saves: currentUserId
				? { where: { userId: currentUserId }, select: { id: true } }
				: undefined,
			offers: {
				orderBy: { createdAt: "desc" },
				include: {
					buyer: {
						select: {
							id: true,
							userName: true,
							firstName: true,
							lastName: true,
							avatar: { select: { photoSrc: true } },
						},
					},
				},
			},
			messages: {
				orderBy: { createdAt: "asc" },
				include: {
					sender: {
						select: {
							id: true,
							userName: true,
							firstName: true,
							lastName: true,
							avatar: { select: { photoSrc: true } },
						},
					},
					likes: currentUserId
						? {
								where: { userId: currentUserId },
								select: { id: true },
							}
						: { select: { id: true }, take: 0 },
					_count: { select: { likes: true } },
				},
			},
			_count: { select: { saves: true } },
		},
	});

	if (listing) {
		await prisma.marketplaceListing.update({
			where: { id: listing.id },
			data: { viewCount: { increment: 1 } },
		});
	}

	return listing;
}

export async function getMyListings() {
	const sellerId = await getSessionUserId();
	return prisma.marketplaceListing.findMany({
		where: { sellerId },
		orderBy: { createdAt: "desc" },
		include: {
			images: { orderBy: { order: "asc" }, take: 1 },
			_count: { select: { saves: true, offers: true, messages: true } },
		},
	});
}

export async function getSavedListings() {
	const userId = await getSessionUserId();
	const saves = await prisma.listingSave.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		include: {
			listing: {
				include: {
					seller: {
						select: {
							id: true,
							userName: true,
							firstName: true,
							lastName: true,
							avatar: { select: { photoSrc: true } },
						},
					},
					images: { orderBy: { order: "asc" }, take: 1 },
					_count: { select: { saves: true } },
				},
			},
		},
	});
	return saves.map((s: { listing: unknown }) => s.listing);
}

export async function toggleListingMessageLike(messageId: number) {
	const userId = await getSessionUserId();
	const existing = await prisma.listingMessageLike.findUnique({
		where: { userId_messageId: { userId, messageId } },
	});
	if (existing) {
		await prisma.listingMessageLike.delete({ where: { id: existing.id } });
		return { liked: false };
	} else {
		await prisma.listingMessageLike.create({ data: { userId, messageId } });
		return { liked: true };
	}
}

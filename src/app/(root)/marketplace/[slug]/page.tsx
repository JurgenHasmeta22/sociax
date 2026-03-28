import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ListingDetailClient } from "@/components/marketplace/ListingDetailClient";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ListingPage({ params }: PageProps) {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);
	const { slug } = await params;

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
			saves: { where: { userId }, select: { id: true } },
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
					likes: {
						where: { userId },
						select: { id: true },
					},
					_count: { select: { likes: true } },
				},
			},
			_count: { select: { saves: true } },
		},
	});

	if (!listing) notFound();

	// Increment view count
	await prisma.marketplaceListing.update({
		where: { id: listing.id },
		data: { viewCount: { increment: 1 } },
	});

	const relatedListings = await prisma.marketplaceListing.findMany({
		where: {
			category: listing.category,
			status: "Active",
			id: { not: listing.id },
		},
		take: 6,
		orderBy: { createdAt: "desc" },
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
			_count: { select: { saves: true } },
		},
	});

	return (
		<ListingDetailClient
			listing={listing as never}
			relatedListings={relatedListings as never}
			currentUserId={userId}
		/>
	);
}

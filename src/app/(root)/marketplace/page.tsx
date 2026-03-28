import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarketplaceClient } from "@/components/marketplace/MarketplaceClient";

export const metadata = { title: "Marketplace · Sociax" };

export default async function MarketplacePage({
	searchParams,
}: {
	searchParams: Promise<{ category?: string; search?: string; tab?: string }>;
}) {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const userId = parseInt(session.user.id);
	const { category, search, tab } = await searchParams;

	const where: Record<string, unknown> = { status: "Active" };
	if (category && category !== "All") where.category = category;
	if (search) {
		where.OR = [
			{ title: { contains: search } },
			{ description: { contains: search } },
		];
	}

	const [listings, myListings, savedListings, currentUser] =
		await Promise.all([
			prisma.marketplaceListing.findMany({
				where: where as never,
				orderBy: { createdAt: "desc" },
				take: 24,
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
			}),
			prisma.marketplaceListing.findMany({
				where: { sellerId: userId },
				orderBy: { createdAt: "desc" },
				include: {
					images: { orderBy: { order: "asc" }, take: 1 },
					_count: {
						select: { saves: true, offers: true, messages: true },
					},
				},
			}),
			prisma.listingSave.findMany({
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
							saves: { where: { userId }, select: { id: true } },
							_count: { select: { saves: true } },
						},
					},
				},
			}),
			prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
					avatar: { select: { photoSrc: true } },
				},
			}),
		]);

	return (
		<MarketplaceClient
			initialListings={listings as never}
			myListings={myListings as never}
			savedListings={(savedListings as never[]).map(
				(s: never) => (s as { listing: never }).listing,
			)}
			currentUser={currentUser!}
			currentUserId={userId}
			initialTab={tab ?? "browse"}
			initialCategory={category ?? "All"}
			initialSearch={search ?? ""}
		/>
	);
}

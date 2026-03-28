"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PostPrivacy } from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function createAlbum(data: {
	name: string;
	description?: string;
	coverUrl?: string;
	privacy?: PostPrivacy;
}) {
	const userId = await getSessionUserId();
	if (!data.name.trim()) throw new Error("Album name is required");

	const album = await prisma.album.create({
		data: {
			name: data.name.trim(),
			description: data.description?.trim() || null,
			coverUrl: data.coverUrl?.trim() || null,
			privacy: data.privacy ?? "Public",
			userId,
		},
	});

	revalidatePath(`/profile`);
	return album;
}

export async function deleteAlbum(id: number) {
	const userId = await getSessionUserId();
	const album = await prisma.album.findUnique({ where: { id } });
	if (!album) throw new Error("Album not found");
	if (album.userId !== userId) throw new Error("Unauthorized");

	await prisma.album.delete({ where: { id } });
	revalidatePath(`/profile`);
}

export async function addPhotoToAlbum(data: {
	albumId: number | null;
	photoUrl: string;
	caption?: string;
}) {
	const userId = await getSessionUserId();

	if (data.albumId !== null) {
		const album = await prisma.album.findUnique({
			where: { id: data.albumId },
		});
		if (!album) throw new Error("Album not found");
		if (album.userId !== userId) throw new Error("Unauthorized");

		const photo = await prisma.albumPhoto.create({
			data: {
				albumId: data.albumId,
				photoUrl: data.photoUrl,
				caption: data.caption?.trim() || null,
			},
		});
		revalidatePath("/profile");
		return photo;
	}

	// No album — store as a standalone post (image only post)
	await prisma.post.create({
		data: {
			userId,
			privacy: "Public",
			media: {
				create: {
					url: data.photoUrl,
					type: "Image",
					order: 0,
				},
			},
		},
	});

	revalidatePath("/profile");
	return null;
}

export async function removePhotoFromAlbum(photoId: number) {
	const userId = await getSessionUserId();
	const photo = await prisma.albumPhoto.findUnique({
		where: { id: photoId },
		include: { album: { select: { userId: true } } },
	});
	if (!photo) throw new Error("Photo not found");
	if (photo.album.userId !== userId) throw new Error("Unauthorized");

	await prisma.albumPhoto.delete({ where: { id: photoId } });
	revalidatePath("/profile");
}

export async function getUserAlbums(
	userId: number,
	viewerUserId?: number | null,
) {
	const isOwn = viewerUserId === userId;

	return prisma.album.findMany({
		where: {
			userId,
			...(isOwn ? {} : { privacy: { in: ["Public", "FriendsOnly"] } }),
		},
		orderBy: { createdAt: "desc" },
		include: {
			_count: { select: { photos: true } },
			photos: { orderBy: { order: "asc" }, take: 1 },
		},
	});
}

export async function getAlbumById(id: number) {
	const session = await getServerSession(authOptions);
	const currentUserId = session ? parseInt(session.user.id) : null;

	const album = await prisma.album.findUnique({
		where: { id },
		include: {
			photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
			user: {
				select: {
					id: true,
					userName: true,
					firstName: true,
					lastName: true,
				},
			},
		},
	});

	if (!album) return null;

	const isOwner = currentUserId === album.userId;
	if (!isOwner && album.privacy === "OnlyMe") return null;

	return { ...album, isOwner };
}

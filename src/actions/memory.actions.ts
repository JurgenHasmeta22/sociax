"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function getUserMemories(skip = 0, take = 20) {
	const userId = await getSessionUserId();

	const memories = await prisma.memory.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		skip,
		take,
		include: {
			post: {
				where: { isDeleted: false },
				include: {
					user: { include: { avatar: true } },
					media: { orderBy: { order: "asc" } },
					likes: {
						select: { id: true, userId: true, reactionType: true },
					},
					saves: { where: { userId }, select: { id: true } },
					_count: { select: { comments: true, shares: true } },
					hashtags: { include: { hashtag: true } },
				},
			},
		},
	});

	return memories.filter((m) => m.post !== null);
}

export async function addMemory(postId: number, note?: string) {
	const userId = await getSessionUserId();

	const existing = await prisma.memory.findFirst({
		where: { userId, postId },
	});
	if (existing) return;

	await prisma.memory.create({
		data: { userId, postId, note: note?.trim() || null },
	});

	revalidatePath("/memories");
}

export async function removeMemory(postId: number) {
	const userId = await getSessionUserId();

	await prisma.memory.deleteMany({
		where: { userId, postId },
	});

	revalidatePath("/memories");
}

export async function updateMemoryNote(memoryId: number, note: string) {
	const userId = await getSessionUserId();

	const memory = await prisma.memory.findUnique({ where: { id: memoryId } });
	if (!memory || memory.userId !== userId) throw new Error("Forbidden");

	await prisma.memory.update({
		where: { id: memoryId },
		data: { note: note.trim() || null },
	});

	revalidatePath("/memories");
}

export async function isPostInMemories(postId: number): Promise<boolean> {
	const userId = await getSessionUserId();
	const memory = await prisma.memory.findFirst({ where: { userId, postId } });
	return memory !== null;
}

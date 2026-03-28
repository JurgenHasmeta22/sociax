"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(id: number) {
	const session = await getServerSession(authOptions);
	if (!session) return { error: "Unauthorized" };
	const userId = parseInt(session.user.id);

	await prisma.notification.updateMany({
		where: { id, userId },
		data: { status: "read" },
	});

	revalidatePath("/notifications");
	return { success: true };
}

export async function markAllNotificationsRead() {
	const session = await getServerSession(authOptions);
	if (!session) return { error: "Unauthorized" };
	const userId = parseInt(session.user.id);

	await prisma.notification.updateMany({
		where: { userId, status: "unread" },
		data: { status: "read" },
	});

	revalidatePath("/notifications");
	return { success: true };
}

export async function getUnreadNotificationCount(): Promise<number> {
	const session = await getServerSession(authOptions);
	if (!session) return 0;
	const userId = parseInt(session.user.id);

	const count = await prisma.notification.count({
		where: { userId, status: "unread" },
	});

	return count;
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcrypt";
import type {
	ProfilePrivacy,
	Gender,
} from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function updateUserProfile(data: {
	firstName: string;
	lastName: string;
	bio: string;
	location: string;
	website: string;
	phone: string;
	birthday: string;
	gender: Gender;
}) {
	const userId = await getSessionUserId();

	await prisma.user.update({
		where: { id: userId },
		data: {
			firstName: data.firstName.trim() || null,
			lastName: data.lastName.trim() || null,
			bio: data.bio.trim() || null,
			location: data.location.trim() || null,
			website: data.website.trim() || null,
			phone: data.phone.trim() || null,
			birthday: data.birthday ? new Date(data.birthday) : null,
			gender: data.gender,
		},
	});

	revalidatePath("/settings");
	revalidatePath("/feed");
}

export async function updateProfilePrivacy(privacy: ProfilePrivacy) {
	const userId = await getSessionUserId();

	await prisma.user.update({
		where: { id: userId },
		data: { profilePrivacy: privacy },
	});

	revalidatePath("/settings");
}

export async function changePassword(
	currentPassword: string,
	newPassword: string,
) {
	const userId = await getSessionUserId();

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { password: true },
	});

	if (!user?.password) throw new Error("No password set on this account.");

	const isValid = await compare(currentPassword, user.password);
	if (!isValid) throw new Error("Current password is incorrect.");

	if (newPassword.length < 8)
		throw new Error("New password must be at least 8 characters.");

	const hashed = await hash(newPassword, 10);
	await prisma.user.update({
		where: { id: userId },
		data: { password: hashed },
	});
}

export async function updateAvatar(photoUrl: string) {
	const userId = await getSessionUserId();

	await prisma.avatar.upsert({
		where: { userId },
		create: { userId, photoSrc: photoUrl },
		update: { photoSrc: photoUrl },
	});

	revalidatePath("/feed");
}

export async function updateCoverPhoto(photoUrl: string) {
	const userId = await getSessionUserId();

	await prisma.coverPhoto.upsert({
		where: { userId },
		create: { userId, photoSrc: photoUrl },
		update: { photoSrc: photoUrl },
	});

	revalidatePath("/feed");
}

// ── Block / Unblock ─────────────────────────────────────────────────────────

export async function blockUser(targetUserId: number) {
	const userId = await getSessionUserId();
	if (userId === targetUserId) throw new Error("Cannot block yourself");

	await prisma.userBlock.upsert({
		where: {
			blockerId_blockedId: { blockerId: userId, blockedId: targetUserId },
		},
		create: { blockerId: userId, blockedId: targetUserId },
		update: {},
	});

	// Also remove any follow relationship
	await prisma.userFollow.deleteMany({
		where: {
			OR: [
				{ followerId: userId, followingId: targetUserId },
				{ followerId: targetUserId, followingId: userId },
			],
		},
	});

	revalidatePath("/people");
}

export async function unblockUser(targetUserId: number) {
	const userId = await getSessionUserId();

	await prisma.userBlock.deleteMany({
		where: { blockerId: userId, blockedId: targetUserId },
	});

	revalidatePath("/settings");
}

export async function getBlockedUsers() {
	const userId = await getSessionUserId();

	return prisma.userBlock.findMany({
		where: { blockerId: userId },
		orderBy: { createdAt: "desc" },
		include: {
			blocked: {
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
}

// ── Report ───────────────────────────────────────────────────────────────────

export async function reportUser(targetUserId: number, reason: string) {
	const userId = await getSessionUserId();
	if (userId === targetUserId) throw new Error("Cannot report yourself");

	await prisma.reportedContent.create({
		data: {
			reportType: "User",
			reason: reason.trim() || null,
			reportingUserId: userId,
			reportedUserId: targetUserId,
			contentId: targetUserId,
		},
	});
}

// ── Account management ────────────────────────────────────────────────────────

export async function deactivateAccount() {
	const userId = await getSessionUserId();

	await prisma.user.update({
		where: { id: userId },
		data: { active: false },
	});
}

export async function deleteAccount(password: string) {
	const userId = await getSessionUserId();

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { password: true },
	});

	// If user has a password, verify it before deleting
	if (user?.password) {
		const valid = await compare(password, user.password);
		if (!valid) throw new Error("Incorrect password");
	}

	await prisma.user.delete({ where: { id: userId } });
}

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

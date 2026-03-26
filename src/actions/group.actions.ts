"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { ReactionType } from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
	const session = await getServerSession(authOptions);
	if (!session) throw new Error("Unauthorized");
	return parseInt(session.user.id);
}

export async function joinGroup(groupId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.groupMember.findUnique({
		where: { userId_groupId: { userId, groupId } },
	});
	if (existing) return;

	const group = await prisma.group.findUnique({ where: { id: groupId } });
	if (!group) throw new Error("Group not found");

	const status = group.privacy === "Public" ? "Approved" : "Pending";
	await prisma.groupMember.create({ data: { userId, groupId, status } });
	revalidatePath("/groups");
	revalidatePath(`/groups/${group.slug}`);
}

export async function leaveGroup(groupId: number) {
	const userId = await getSessionUserId();

	await prisma.groupMember.deleteMany({ where: { userId, groupId } });

	const group = await prisma.group.findUnique({ where: { id: groupId } });
	revalidatePath("/groups");
	if (group) revalidatePath(`/groups/${group.slug}`);
}

export async function createGroupPost(groupId: number, content: string) {
	const userId = await getSessionUserId();
	if (!content.trim()) return;

	const member = await prisma.groupMember.findUnique({
		where: { userId_groupId: { userId, groupId } },
	});
	if (!member || member.status !== "Approved")
		throw new Error("Not a member");

	const group = await prisma.group.findUnique({ where: { id: groupId } });

	const post = await prisma.groupPost.create({
		data: { groupId, userId, content: content.trim() },
		include: {
			user: { include: { avatar: true } },
			likes: { select: { id: true, userId: true, reactionType: true } },
			_count: { select: { comments: true } },
		},
	});

	if (group) revalidatePath(`/groups/${group.slug}`);
	return post;
}

export async function deleteGroupPost(groupPostId: number) {
	const userId = await getSessionUserId();

	const post = await prisma.groupPost.findUnique({
		where: { id: groupPostId },
	});
	if (!post || post.userId !== userId) throw new Error("Forbidden");

	await prisma.groupPost.update({
		where: { id: groupPostId },
		data: { isDeleted: true },
	});

	const group = await prisma.group.findUnique({
		where: { id: post.groupId },
	});
	if (group) revalidatePath(`/groups/${group.slug}`);
}

export async function toggleGroupPostLike(
	groupPostId: number,
	reactionType: ReactionType,
) {
	const userId = await getSessionUserId();

	const existing = await prisma.groupPostLike.findUnique({
		where: { userId_groupPostId: { userId, groupPostId } },
	});

	if (existing) {
		if (existing.reactionType === reactionType) {
			await prisma.groupPostLike.delete({
				where: { userId_groupPostId: { userId, groupPostId } },
			});
		} else {
			await prisma.groupPostLike.update({
				where: { userId_groupPostId: { userId, groupPostId } },
				data: { reactionType },
			});
		}
	} else {
		await prisma.groupPostLike.create({
			data: { userId, groupPostId, reactionType },
		});
	}

	const post = await prisma.groupPost.findUnique({
		where: { id: groupPostId },
	});
	const group = post
		? await prisma.group.findUnique({ where: { id: post.groupId } })
		: null;
	if (group) revalidatePath(`/groups/${group.slug}`);
}

export async function createGroupPostComment(
	groupPostId: number,
	content: string,
) {
	const userId = await getSessionUserId();
	if (!content.trim()) return;

	await prisma.groupPostComment.create({
		data: { groupPostId, userId, content: content.trim() },
	});

	const post = await prisma.groupPost.findUnique({
		where: { id: groupPostId },
	});
	const group = post
		? await prisma.group.findUnique({ where: { id: post.groupId } })
		: null;
	if (group) revalidatePath(`/groups/${group.slug}`);
}

export async function deleteGroupPostComment(commentId: number) {
	const userId = await getSessionUserId();

	const comment = await prisma.groupPostComment.findUnique({
		where: { id: commentId },
	});
	if (!comment || comment.userId !== userId) throw new Error("Forbidden");

	await prisma.groupPostComment.update({
		where: { id: commentId },
		data: { isDeleted: true },
	});
}

export async function getGroupPostComments(groupPostId: number) {
	return prisma.groupPostComment.findMany({
		where: { groupPostId, isDeleted: false },
		orderBy: { createdAt: "asc" },
		include: {
			user: {
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

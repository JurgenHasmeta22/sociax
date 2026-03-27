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

export async function createGroupPost(
	groupId: number,
	content: string,
	mediaUrl?: string,
) {
	const userId = await getSessionUserId();
	if (!content.trim() && !mediaUrl?.trim()) return;

	const member = await prisma.groupMember.findUnique({
		where: { userId_groupId: { userId, groupId } },
	});
	if (!member || member.status !== "Approved")
		throw new Error("Not a member");

	const group = await prisma.group.findUnique({ where: { id: groupId } });

	const post = await prisma.groupPost.create({
		data: {
			groupId,
			userId,
			content: content.trim() || null,
			mediaUrl: mediaUrl?.trim() || null,
		},
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

export async function getGroupPostReactions(groupPostId: number) {
	return prisma.groupPostLike.findMany({
		where: { groupPostId },
		orderBy: { createdAt: "desc" },
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

export async function createGroupPostComment(
	groupPostId: number,
	content: string,
	mediaUrl?: string,
) {
	const userId = await getSessionUserId();
	if (!content.trim() && !mediaUrl) return;

	await prisma.groupPostComment.create({
		data: { groupPostId, userId, content: content.trim(), ...(mediaUrl ? { mediaUrl } : {}) },
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

export async function getGroupPostComments(
	groupPostId: number,
	currentUserId?: number,
) {
	const comments = await prisma.groupPostComment.findMany({
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
			_count: { select: { likes: true } },
			likes: currentUserId
				? { where: { userId: currentUserId }, select: { id: true } }
				: false,
		},
	});

	return comments.map((c) => ({
		...c,
		likeCount: c._count.likes,
		isLikedByMe: currentUserId ? c.likes.length > 0 : false,
		likes: undefined,
		_count: undefined,
	}));
}

export async function toggleGroupPostCommentLike(commentId: number) {
	const userId = await getSessionUserId();

	const existing = await prisma.groupPostCommentLike.findUnique({
		where: {
			userId_groupPostCommentId: {
				userId,
				groupPostCommentId: commentId,
			},
		},
	});

	if (existing) {
		await prisma.groupPostCommentLike.delete({
			where: {
				userId_groupPostCommentId: {
					userId,
					groupPostCommentId: commentId,
				},
			},
		});
	} else {
		await prisma.groupPostCommentLike.create({
			data: { userId, groupPostCommentId: commentId },
		});
	}
}

const GROUPS_LIMIT = 12;

export async function fetchMoreGroups(skip: number, query: string) {
	const session = await getServerSession(authOptions);
	const userId = session ? parseInt(session.user.id) : null;

	const where = query.trim()
		? { name: { contains: query.trim() } }
		: undefined;

	const [groups, total, memberships] = await Promise.all([
		prisma.group.findMany({
			where,
			skip,
			take: GROUPS_LIMIT,
			orderBy: { createdAt: "desc" },
			include: {
				owner: { include: { avatar: true } },
				_count: { select: { members: true, posts: true } },
			},
		}),
		prisma.group.count({ where }),
		userId
			? prisma.groupMember.findMany({
					where: { userId },
					select: { groupId: true, status: true },
				})
			: [],
	]);

	const membershipMap: Record<number, string> = {};
	for (const m of memberships) membershipMap[m.groupId] = m.status;

	return { groups, membershipMap, total };
}

export async function fetchPopularGroups(skip: number, query: string) {
	const session = await getServerSession(authOptions);
	const userId = session ? parseInt(session.user.id) : null;

	const where = query.trim()
		? { name: { contains: query.trim() } }
		: undefined;

	const [groups, total, memberships] = await Promise.all([
		prisma.group.findMany({
			where,
			skip,
			take: GROUPS_LIMIT,
			orderBy: { members: { _count: "desc" } },
			include: {
				owner: { include: { avatar: true } },
				_count: { select: { members: true, posts: true } },
			},
		}),
		prisma.group.count({ where }),
		userId
			? prisma.groupMember.findMany({
					where: { userId },
					select: { groupId: true, status: true },
				})
			: [],
	]);

	const membershipMap: Record<number, string> = {};
	for (const m of memberships) membershipMap[m.groupId] = m.status;

	return { groups, membershipMap, total };
}

export async function fetchMyGroups(skip: number, query: string) {
	const userId = await getSessionUserId();

	const memberWhere = query.trim()
		? { userId, status: "Approved" as const, group: { name: { contains: query.trim() } } }
		: { userId, status: "Approved" as const };

	const [memberships, total] = await Promise.all([
		prisma.groupMember.findMany({
			where: memberWhere,
			skip,
			take: GROUPS_LIMIT,
			orderBy: { joinedAt: "desc" },
			include: {
				group: {
					include: {
						owner: { include: { avatar: true } },
						_count: { select: { members: true, posts: true } },
					},
				},
			},
		}),
		prisma.groupMember.count({ where: memberWhere }),
	]);

	const groups = memberships.map((m) => m.group);
	const membershipMap: Record<number, string> = {};
	for (const m of memberships) membershipMap[m.groupId] = m.status;

	return { groups, membershipMap, total };
}

export async function createGroup(data: {
	name: string;
	description: string;
	privacy: string;
}) {
	const userId = await getSessionUserId();
	if (!data.name.trim()) throw new Error("Name required");

	const baseSlug =
		data.name
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "")
			.slice(0, 50) || "group";

	let slug = baseSlug;
	let counter = 1;
	while (await prisma.group.findUnique({ where: { slug } })) {
		slug = `${baseSlug}-${counter++}`;
	}

	const group = await prisma.group.create({
		data: {
			name: data.name.trim(),
			slug,
			description: data.description.trim() || null,
			privacy: data.privacy as "Public" | "Private" | "Secret",
			ownerId: userId,
			members: {
				create: { userId, role: "Admin", status: "Approved" },
			},
		},
	});

	revalidatePath("/groups");
	return group;
}

const MEMBERS_LIMIT = 20;

export async function getGroupMembers(groupId: number, skip: number) {
	const [members, total] = await Promise.all([
		prisma.groupMember.findMany({
			where: { groupId, status: "Approved" },
			skip,
			take: MEMBERS_LIMIT,
			orderBy: { joinedAt: "asc" },
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
		}),
		prisma.groupMember.count({ where: { groupId, status: "Approved" } }),
	]);

	return {
		members: members.map((m) => ({ ...m.user, role: m.role })),
		total,
		hasMore: skip + MEMBERS_LIMIT < total,
	};
}

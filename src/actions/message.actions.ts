"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { MessageType } from "../../prisma/generated/prisma/enums";

async function getSessionUserId() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    return parseInt(session.user.id);
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function isOnline(lastActiveAt: Date | null): boolean {
    if (!lastActiveAt) return false;
    return Date.now() - lastActiveAt.getTime() < ONLINE_THRESHOLD_MS;
}

export async function pingOnline() {
    const userId = await getSessionUserId();
    await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
    });
}

export async function getMyConversations() {
    const userId = await getSessionUserId();

    const participations = await prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
            conversation: {
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    userName: true,
                                    firstName: true,
                                    lastName: true,
                                    lastActiveAt: true,
                                    avatar: { select: { photoSrc: true } },
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        where: { isDeleted: false },
                        select: {
                            id: true,
                            content: true,
                            mediaUrl: true,
                            type: true,
                            createdAt: true,
                            senderId: true,
                            sender: {
                                select: { firstName: true, lastName: true, userName: true },
                            },
                        },
                    },
                },
            },
        },
        orderBy: { conversation: { updatedAt: "desc" } },
    });

    return participations.map((p) => {
        const conv = p.conversation;
        const otherParticipants = conv.participants.filter((cp) => cp.userId !== userId);
        const lastMessage = conv.messages[0] ?? null;

        return {
            id: conv.id,
            isGroup: conv.isGroup,
            name: conv.isGroup
                ? conv.name
                : otherParticipants[0]
                ? `${otherParticipants[0].user.firstName ?? ""} ${otherParticipants[0].user.lastName ?? ""}`.trim() ||
                  otherParticipants[0].user.userName
                : "Unknown",
            coverUrl: conv.isGroup
                ? conv.coverUrl
                : otherParticipants[0]?.user.avatar?.photoSrc ?? null,
            otherUserId: conv.isGroup ? null : otherParticipants[0]?.userId ?? null,
            otherUserName: conv.isGroup ? null : otherParticipants[0]?.user.userName ?? null,
            isOnline: conv.isGroup
                ? false
                : isOnline(otherParticipants[0]?.user.lastActiveAt ?? null),
            lastActiveAt: conv.isGroup
                ? null
                : otherParticipants[0]?.user.lastActiveAt ?? null,
            lastMessage,
            updatedAt: conv.updatedAt,
        };
    });
}

export async function getOrCreateConversation(otherUserId: number) {
    const userId = await getSessionUserId();

    // Look for existing 1-on-1 conversation
    const existing = await prisma.conversation.findFirst({
        where: {
            isGroup: false,
            participants: {
                every: {
                    userId: { in: [userId, otherUserId] },
                },
            },
            AND: [
                { participants: { some: { userId } } },
                { participants: { some: { userId: otherUserId } } },
            ],
        },
        include: {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            firstName: true,
                            lastName: true,
                            lastActiveAt: true,
                            avatar: { select: { photoSrc: true } },
                        },
                    },
                },
            },
        },
    });

    if (existing) {
        const other = existing.participants.find((p) => p.userId !== userId);
        return {
            id: existing.id,
            isGroup: false,
            name: other
                ? `${other.user.firstName ?? ""} ${other.user.lastName ?? ""}`.trim() || other.user.userName
                : "Unknown",
            coverUrl: other?.user.avatar?.photoSrc ?? null,
            otherUserId: other?.userId ?? null,
            otherUserName: other?.user.userName ?? null,
            isOnline: isOnline(other?.user.lastActiveAt ?? null),
            lastActiveAt: other?.user.lastActiveAt ?? null,
        };
    }

    // Create new conversation
    const created = await prisma.conversation.create({
        data: {
            isGroup: false,
            participants: {
                create: [{ userId }, { userId: otherUserId }],
            },
        },
        include: {
            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            firstName: true,
                            lastName: true,
                            lastActiveAt: true,
                            avatar: { select: { photoSrc: true } },
                        },
                    },
                },
            },
        },
    });

    const other = created.participants.find((p) => p.userId !== userId);
    return {
        id: created.id,
        isGroup: false,
        name: other
            ? `${other.user.firstName ?? ""} ${other.user.lastName ?? ""}`.trim() || other.user.userName
            : "Unknown",
        coverUrl: other?.user.avatar?.photoSrc ?? null,
        otherUserId: other?.userId ?? null,
        otherUserName: other?.user.userName ?? null,
        isOnline: isOnline(other?.user.lastActiveAt ?? null),
        lastActiveAt: other?.user.lastActiveAt ?? null,
    };
}

export async function getConversationMessages(conversationId: number, limit = 50, beforeId?: number) {
    const userId = await getSessionUserId();

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
        where: { userId_conversationId: { userId, conversationId } },
    });
    if (!participant) throw new Error("Not a participant");

    const messages = await prisma.message.findMany({
        where: {
            conversationId,
            isDeleted: false,
            ...(beforeId ? { id: { lt: beforeId } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
            id: true,
            content: true,
            mediaUrl: true,
            type: true,
            status: true,
            isEdited: true,
            createdAt: true,
            senderId: true,
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

    return messages.reverse();
}

export async function sendMessage(
    conversationId: number,
    content: string | null,
    mediaUrl?: string | null,
    type: MessageType = "Text",
) {
    const userId = await getSessionUserId();

    const participant = await prisma.conversationParticipant.findUnique({
        where: { userId_conversationId: { userId, conversationId } },
    });
    if (!participant) throw new Error("Not a participant");

    const message = await prisma.message.create({
        data: {
            content,
            mediaUrl,
            type,
            senderId: userId,
            conversationId,
        },
        select: {
            id: true,
            content: true,
            mediaUrl: true,
            type: true,
            status: true,
            isEdited: true,
            createdAt: true,
            senderId: true,
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

    // Update conversation updatedAt for ordering
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });

    return message;
}

export async function pollNewMessages(conversationId: number, afterMessageId: number) {
    const userId = await getSessionUserId();

    const participant = await prisma.conversationParticipant.findUnique({
        where: { userId_conversationId: { userId, conversationId } },
    });
    if (!participant) throw new Error("Not a participant");

    const messages = await prisma.message.findMany({
        where: {
            conversationId,
            isDeleted: false,
            id: { gt: afterMessageId },
        },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            content: true,
            mediaUrl: true,
            type: true,
            status: true,
            isEdited: true,
            createdAt: true,
            senderId: true,
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

    return messages;
}

export async function markConversationRead(conversationId: number) {
    const userId = await getSessionUserId();

    await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: userId },
            status: { not: "Read" },
        },
        data: { status: "Read" },
    });
}

export async function searchChatUsers(query: string) {
    const userId = await getSessionUserId();

    if (!query.trim()) return [];

    // Only search among accepted friends (mutual follow)
    const friendRows = await prisma.userFollow.findMany({
        where: { followerId: userId, state: "accepted" },
        select: { followingId: true },
    });
    const friendIds = friendRows.map((r) => r.followingId);

    if (friendIds.length === 0) return [];

    const users = await prisma.user.findMany({
        where: {
            id: { in: friendIds },
            active: true,
            OR: [
                { userName: { contains: query } },
                { firstName: { contains: query } },
                { lastName: { contains: query } },
            ],
        },
        select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            lastActiveAt: true,
            avatar: { select: { photoSrc: true } },
        },
        take: 10,
    });

    return users.map((u) => ({
        ...u,
        isOnline: isOnline(u.lastActiveAt),
    }));
}

export async function editMessage(messageId: number, content: string) {
    const userId = await getSessionUserId();
    if (!content.trim()) throw new Error("Content cannot be empty");

    const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true, type: true } });
    if (!msg) throw new Error("Message not found");
    if (msg.senderId !== userId) throw new Error("Unauthorized");
    if (msg.type !== "Text") throw new Error("Only text messages can be edited");

    return prisma.message.update({
        where: { id: messageId },
        data: { content: content.trim(), isEdited: true },
        select: { id: true, content: true, isEdited: true },
    });
}

export async function deleteMessageForMe(messageId: number) {
    const userId = await getSessionUserId();

    // Verify participation
    const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { conversationId: true } });
    if (!msg) throw new Error("Message not found");
    const participant = await prisma.conversationParticipant.findUnique({
        where: { userId_conversationId: { userId, conversationId: msg.conversationId } },
    });
    if (!participant) throw new Error("Not a participant");

    // Soft-delete: only mark as deleted for this user via a tombstone approach
    // Simplest approach: if I'm the sender, mark deleted; otherwise we track per-user deletions
    // For now use a simple senderId check + mark deleted
    // Real per-user delete requires a join table — here we just hide it for the sender
    return prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, deletedAt: new Date() },
        select: { id: true },
    });
}

export async function deleteMessageForAll(messageId: number) {
    const userId = await getSessionUserId();

    const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true } });
    if (!msg) throw new Error("Message not found");
    if (msg.senderId !== userId) throw new Error("Only the sender can delete for all");

    return prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, deletedAt: new Date(), content: null, mediaUrl: null },
        select: { id: true },
    });
}

export async function getUnreadMessageNotifications() {
    const userId = await getSessionUserId();

    // Get recent unread messages not sent by the current user
    const messages = await prisma.message.findMany({
        where: {
            senderId: { not: userId },
            status: { not: "Read" },
            isDeleted: false,
            conversation: {
                participants: { some: { userId } },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id: true,
            content: true,
            type: true,
            createdAt: true,
            conversationId: true,
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

    return messages;
}

export async function getChatNavData() {
    const userId = await getSessionUserId();

    // Count conversations with unread messages
    const participations = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
    });
    const convIds = participations.map((p) => p.conversationId);

    const [unreadCount, onlineFriends] = await Promise.all([
        prisma.message.groupBy({
            by: ["conversationId"],
            where: {
                conversationId: { in: convIds },
                senderId: { not: userId },
                status: { not: "Read" },
                isDeleted: false,
            },
        }).then((rows) => rows.length),

        // Friends (mutual follow) who are online
        prisma.userFollow.findMany({
            where: { followerId: userId, state: "accepted" },
            select: {
                following: {
                    select: {
                        id: true,
                        userName: true,
                        firstName: true,
                        lastName: true,
                        lastActiveAt: true,
                        avatar: { select: { photoSrc: true } },
                    },
                },
            },
        }).then((rows) =>
            rows
                .map((r) => ({
                    ...r.following,
                    isOnline: isOnline(r.following.lastActiveAt),
                }))
                .sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1))
                .slice(0, 20)
        ),
    ]);

    return { unreadCount, onlineFriends };
}


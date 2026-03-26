/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ResetPasswordToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetPasswordAt" DATETIME,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ResetPasswordToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "deletedAt" DATETIME,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentReply" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "deletedAt" DATETIME,
    "commentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "CommentReply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReplyLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "replyId" INTEGER NOT NULL,
    CONSTRAINT "ReplyLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReplyLike_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "CommentReply" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "onlineLink" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'Public',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" INTEGER NOT NULL,
    CONSTRAINT "Event_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'Interested',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "avatarUrl" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'Public',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT,
    "mediaUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "GroupPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupPostLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "groupPostId" INTEGER NOT NULL,
    CONSTRAINT "GroupPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupPostLike_groupPostId_fkey" FOREIGN KEY ("groupPostId") REFERENCES "GroupPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupPostComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "groupPostId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "GroupPostComment_groupPostId_fkey" FOREIGN KEY ("groupPostId") REFERENCES "GroupPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "coverUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "conversationId" INTEGER NOT NULL,
    CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT,
    "mediaUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Text',
    "status" TEXT NOT NULL DEFAULT 'Sent',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "deletedAt" DATETIME,
    "senderId" INTEGER NOT NULL,
    "conversationId" INTEGER NOT NULL,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportedContent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportType" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "resolutionDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentId" INTEGER NOT NULL,
    "reportingUserId" INTEGER NOT NULL,
    "reportedUserId" INTEGER,
    CONSTRAINT "ReportedContent_reportingUserId_fkey" FOREIGN KEY ("reportingUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportedContent_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actionType" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatorUserId" INTEGER NOT NULL,
    "targetUserId" INTEGER,
    "targetContentId" INTEGER,
    CONSTRAINT "ModerationLog_moderatorUserId_fkey" FOREIGN KEY ("moderatorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModerationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "avatarUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "website" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" INTEGER NOT NULL,
    CONSTRAINT "Page_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PageFollower" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "pageId" INTEGER NOT NULL,
    CONSTRAINT "PageFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PageFollower_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PagePost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT,
    "mediaUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "PagePost_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PagePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PagePostLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "pagePostId" INTEGER NOT NULL,
    CONSTRAINT "PagePostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PagePostLike_pagePostId_fkey" FOREIGN KEY ("pagePostId") REFERENCES "PagePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PagePostComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "pagePostId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "PagePostComment_pagePostId_fkey" FOREIGN KEY ("pagePostId") REFERENCES "PagePost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PagePostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Original',
    "privacy" TEXT NOT NULL DEFAULT 'Public',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "userId" INTEGER NOT NULL,
    "sharedPostId" INTEGER,
    CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostMedia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Image',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" INTEGER NOT NULL,
    CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostSave" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    CONSTRAINT "PostSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostShare" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    CONSTRAINT "PostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT,
    "editedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" INTEGER NOT NULL,
    "editedById" INTEGER NOT NULL,
    CONSTRAINT "PostHistory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostHistory_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PostHashtag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "hashtagId" INTEGER NOT NULL,
    CONSTRAINT "PostHashtag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Story" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mediaUrl" TEXT NOT NULL,
    "caption" TEXT,
    "privacy" TEXT NOT NULL DEFAULT 'FriendsOnly',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryReaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reaction" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "StoryReaction_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Avatar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "photoSrc" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverPhoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "photoSrc" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "CoverPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockerId" INTEGER NOT NULL,
    "blockedId" INTEGER NOT NULL,
    CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "userId" INTEGER NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("access_token", "expires_at", "id", "id_token", "provider", "providerAccountId", "refresh_token", "scope", "session_state", "token_type", "type", "userId") SELECT "access_token", "expires_at", "id", "id_token", "provider", "providerAccountId", "refresh_token", "scope", "session_state", "token_type", "type", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("expires", "id", "sessionToken", "userId") SELECT "expires", "id", "sessionToken", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'User',
    "firstName" TEXT,
    "lastName" TEXT,
    "bio" TEXT,
    "birthday" DATETIME,
    "gender" TEXT NOT NULL DEFAULT 'PreferNotToSay',
    "phone" TEXT,
    "website" TEXT,
    "location" TEXT,
    "profilePrivacy" TEXT NOT NULL DEFAULT 'Public',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "canResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("active", "bio", "createdAt", "email", "id", "password", "role", "updatedAt", "userName") SELECT "active", "bio", "createdAt", "email", "id", "password", "role", "updatedAt", "userName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_userName_idx" ON "User"("userName" ASC);
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ResetPasswordToken_token_key" ON "ResetPasswordToken"("token");

-- CreateIndex
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");

-- CreateIndex
CREATE INDEX "PostComment_userId_idx" ON "PostComment"("userId");

-- CreateIndex
CREATE INDEX "PostComment_createdAt_idx" ON "PostComment"("createdAt");

-- CreateIndex
CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_userId_commentId_key" ON "CommentLike"("userId", "commentId");

-- CreateIndex
CREATE INDEX "CommentReply_commentId_idx" ON "CommentReply"("commentId");

-- CreateIndex
CREATE INDEX "CommentReply_userId_idx" ON "CommentReply"("userId");

-- CreateIndex
CREATE INDEX "CommentReply_createdAt_idx" ON "CommentReply"("createdAt");

-- CreateIndex
CREATE INDEX "ReplyLike_replyId_idx" ON "ReplyLike"("replyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplyLike_userId_replyId_key" ON "ReplyLike"("userId", "replyId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_creatorId_idx" ON "Event"("creatorId");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "Event_privacy_idx" ON "Event"("privacy");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "EventAttendee_eventId_idx" ON "EventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "EventAttendee_status_idx" ON "EventAttendee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_eventId_userId_key" ON "EventAttendee"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

-- CreateIndex
CREATE INDEX "Group_slug_idx" ON "Group"("slug");

-- CreateIndex
CREATE INDEX "Group_privacy_idx" ON "Group"("privacy");

-- CreateIndex
CREATE INDEX "Group_createdAt_idx" ON "Group"("createdAt");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_status_idx" ON "GroupMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");

-- CreateIndex
CREATE INDEX "GroupPost_groupId_idx" ON "GroupPost"("groupId");

-- CreateIndex
CREATE INDEX "GroupPost_userId_idx" ON "GroupPost"("userId");

-- CreateIndex
CREATE INDEX "GroupPost_createdAt_idx" ON "GroupPost"("createdAt");

-- CreateIndex
CREATE INDEX "GroupPostLike_groupPostId_idx" ON "GroupPostLike"("groupPostId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPostLike_userId_groupPostId_key" ON "GroupPostLike"("userId", "groupPostId");

-- CreateIndex
CREATE INDEX "GroupPostComment_groupPostId_idx" ON "GroupPostComment"("groupPostId");

-- CreateIndex
CREATE INDEX "GroupPostComment_userId_idx" ON "GroupPostComment"("userId");

-- CreateIndex
CREATE INDEX "GroupPostComment_createdAt_idx" ON "GroupPostComment"("createdAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_userId_conversationId_key" ON "ConversationParticipant"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");

-- CreateIndex
CREATE INDEX "ReportedContent_contentId_idx" ON "ReportedContent"("contentId");

-- CreateIndex
CREATE INDEX "ReportedContent_status_idx" ON "ReportedContent"("status");

-- CreateIndex
CREATE INDEX "ReportedContent_reportingUserId_idx" ON "ReportedContent"("reportingUserId");

-- CreateIndex
CREATE INDEX "ModerationLog_targetUserId_idx" ON "ModerationLog"("targetUserId");

-- CreateIndex
CREATE INDEX "ModerationLog_targetContentId_idx" ON "ModerationLog"("targetContentId");

-- CreateIndex
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_category_idx" ON "Page"("category");

-- CreateIndex
CREATE INDEX "Page_createdAt_idx" ON "Page"("createdAt");

-- CreateIndex
CREATE INDEX "PageFollower_pageId_idx" ON "PageFollower"("pageId");

-- CreateIndex
CREATE INDEX "PageFollower_userId_idx" ON "PageFollower"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PageFollower_userId_pageId_key" ON "PageFollower"("userId", "pageId");

-- CreateIndex
CREATE INDEX "PagePost_pageId_idx" ON "PagePost"("pageId");

-- CreateIndex
CREATE INDEX "PagePost_userId_idx" ON "PagePost"("userId");

-- CreateIndex
CREATE INDEX "PagePost_createdAt_idx" ON "PagePost"("createdAt");

-- CreateIndex
CREATE INDEX "PagePostLike_pagePostId_idx" ON "PagePostLike"("pagePostId");

-- CreateIndex
CREATE UNIQUE INDEX "PagePostLike_userId_pagePostId_key" ON "PagePostLike"("userId", "pagePostId");

-- CreateIndex
CREATE INDEX "PagePostComment_pagePostId_idx" ON "PagePostComment"("pagePostId");

-- CreateIndex
CREATE INDEX "PagePostComment_userId_idx" ON "PagePostComment"("userId");

-- CreateIndex
CREATE INDEX "PagePostComment_createdAt_idx" ON "PagePostComment"("createdAt");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_privacy_idx" ON "Post"("privacy");

-- CreateIndex
CREATE INDEX "Post_isDeleted_idx" ON "Post"("isDeleted");

-- CreateIndex
CREATE INDEX "PostMedia_postId_idx" ON "PostMedia"("postId");

-- CreateIndex
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_userId_postId_key" ON "PostLike"("userId", "postId");

-- CreateIndex
CREATE INDEX "PostSave_userId_idx" ON "PostSave"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostSave_userId_postId_key" ON "PostSave"("userId", "postId");

-- CreateIndex
CREATE INDEX "PostShare_postId_idx" ON "PostShare"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostShare_userId_postId_key" ON "PostShare"("userId", "postId");

-- CreateIndex
CREATE INDEX "PostHistory_postId_idx" ON "PostHistory"("postId");

-- CreateIndex
CREATE INDEX "PostHistory_editedAt_idx" ON "PostHistory"("editedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_name_key" ON "Hashtag"("name");

-- CreateIndex
CREATE INDEX "Hashtag_name_idx" ON "Hashtag"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PostHashtag_postId_hashtagId_key" ON "PostHashtag"("postId", "hashtagId");

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- CreateIndex
CREATE INDEX "StoryView_storyId_idx" ON "StoryView"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_storyId_userId_key" ON "StoryView"("storyId", "userId");

-- CreateIndex
CREATE INDEX "StoryReaction_storyId_idx" ON "StoryReaction"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryReaction_storyId_userId_key" ON "StoryReaction"("storyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_userId_key" ON "Avatar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoverPhoto_userId_key" ON "CoverPhoto"("userId");

-- CreateIndex
CREATE INDEX "UserFollow_state_idx" ON "UserFollow"("state");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

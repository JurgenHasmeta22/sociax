-- CreateTable
CREATE TABLE "EventPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT,
    "mediaUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "EventPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventPostLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "eventPostId" INTEGER NOT NULL,
    CONSTRAINT "EventPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventPostLike_eventPostId_fkey" FOREIGN KEY ("eventPostId") REFERENCES "EventPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventPostComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventPostId" INTEGER NOT NULL,
    CONSTRAINT "EventPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventPostComment_eventPostId_fkey" FOREIGN KEY ("eventPostId") REFERENCES "EventPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventPostCommentLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "eventPostCommentId" INTEGER NOT NULL,
    CONSTRAINT "EventPostCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventPostCommentLike_eventPostCommentId_fkey" FOREIGN KEY ("eventPostCommentId") REFERENCES "EventPostComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EventPost_eventId_idx" ON "EventPost"("eventId");

-- CreateIndex
CREATE INDEX "EventPost_userId_idx" ON "EventPost"("userId");

-- CreateIndex
CREATE INDEX "EventPost_createdAt_idx" ON "EventPost"("createdAt");

-- CreateIndex
CREATE INDEX "EventPostLike_eventPostId_idx" ON "EventPostLike"("eventPostId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPostLike_userId_eventPostId_key" ON "EventPostLike"("userId", "eventPostId");

-- CreateIndex
CREATE INDEX "EventPostComment_eventPostId_idx" ON "EventPostComment"("eventPostId");

-- CreateIndex
CREATE INDEX "EventPostComment_userId_idx" ON "EventPostComment"("userId");

-- CreateIndex
CREATE INDEX "EventPostCommentLike_eventPostCommentId_idx" ON "EventPostCommentLike"("eventPostCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "EventPostCommentLike_userId_eventPostCommentId_key" ON "EventPostCommentLike"("userId", "eventPostCommentId");

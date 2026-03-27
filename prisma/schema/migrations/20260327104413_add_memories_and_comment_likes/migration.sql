-- CreateTable
CREATE TABLE "GroupPostCommentLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "groupPostCommentId" INTEGER NOT NULL,
    CONSTRAINT "GroupPostCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupPostCommentLike_groupPostCommentId_fkey" FOREIGN KEY ("groupPostCommentId") REFERENCES "GroupPostComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER,
    CONSTRAINT "Memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Memory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PagePostCommentLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL DEFAULT 'Like',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "pagePostCommentId" INTEGER NOT NULL,
    CONSTRAINT "PagePostCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PagePostCommentLike_pagePostCommentId_fkey" FOREIGN KEY ("pagePostCommentId") REFERENCES "PagePostComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GroupPostCommentLike_groupPostCommentId_idx" ON "GroupPostCommentLike"("groupPostCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPostCommentLike_userId_groupPostCommentId_key" ON "GroupPostCommentLike"("userId", "groupPostCommentId");

-- CreateIndex
CREATE INDEX "Memory_userId_idx" ON "Memory"("userId");

-- CreateIndex
CREATE INDEX "Memory_postId_idx" ON "Memory"("postId");

-- CreateIndex
CREATE INDEX "Memory_createdAt_idx" ON "Memory"("createdAt");

-- CreateIndex
CREATE INDEX "PagePostCommentLike_pagePostCommentId_idx" ON "PagePostCommentLike"("pagePostCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "PagePostCommentLike_userId_pagePostCommentId_key" ON "PagePostCommentLike"("userId", "pagePostCommentId");

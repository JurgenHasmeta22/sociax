-- CreateTable
CREATE TABLE "VideoCommentLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "commentId" INTEGER NOT NULL,
    CONSTRAINT "VideoCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "VideoComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VideoCommentLike_commentId_idx" ON "VideoCommentLike"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoCommentLike_userId_commentId_key" ON "VideoCommentLike"("userId", "commentId");

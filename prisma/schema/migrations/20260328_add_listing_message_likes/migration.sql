-- CreateTable
CREATE TABLE "ListingMessageLike" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "messageId" INTEGER NOT NULL,
    CONSTRAINT "ListingMessageLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingMessageLike_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ListingMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingMessageLike_userId_messageId_key" ON "ListingMessageLike"("userId", "messageId");

-- CreateIndex
CREATE INDEX "ListingMessageLike_userId_idx" ON "ListingMessageLike"("userId");

-- CreateIndex
CREATE INDEX "ListingMessageLike_messageId_idx" ON "ListingMessageLike"("messageId");

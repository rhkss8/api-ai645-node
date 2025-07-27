-- CreateEnum
CREATE TYPE "BoardCategory" AS ENUM ('NOTICE', 'SUGGESTION', 'PARTNERSHIP');

-- CreateTable
CREATE TABLE "board_posts" (
    "id" TEXT NOT NULL,
    "category" "BoardCategory" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" VARCHAR(40) NOT NULL,
    "authorId" TEXT,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "board_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_posts_category_idx" ON "board_posts"("category");

-- CreateIndex
CREATE INDEX "board_posts_isImportant_idx" ON "board_posts"("isImportant");

-- CreateIndex
CREATE INDEX "board_posts_createdAt_idx" ON "board_posts"("createdAt");

-- CreateIndex
CREATE INDEX "board_posts_authorId_idx" ON "board_posts"("authorId");

-- AddForeignKey
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "recommendation_history" (
    "id" TEXT NOT NULL,
    "round" INTEGER,
    "numbers" JSONB NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "conditions" JSONB,
    "imageData" JSONB,
    "gptModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_review" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "winningNumbers" JSONB NOT NULL,
    "matchedCounts" JSONB NOT NULL,
    "reviewText" TEXT NOT NULL,
    "analysisPrompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winning_numbers" (
    "id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "numbers" JSONB NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winning_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "gptModel" TEXT,
    "tokenUsed" INTEGER,
    "cost" DOUBLE PRECISION,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "userIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "winning_numbers_round_key" ON "winning_numbers"("round");

-- AddForeignKey
ALTER TABLE "recommendation_review" ADD CONSTRAINT "recommendation_review_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendation_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

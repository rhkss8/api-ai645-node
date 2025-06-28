-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'KAKAO', 'GOOGLE', 'NAVER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "nickname" TEXT,
    "password" TEXT,
    "provider" "AuthProvider" NOT NULL,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

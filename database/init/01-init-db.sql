-- PostgreSQL 초기화 스크립트
-- 이 스크립트는 PostgreSQL 컨테이너가 처음 시작될 때 실행됩니다.

-- 1. main 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS main;

-- 2. main 데이터베이스로 연결
\c main;

-- 3. 스키마 설정
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 4. 사용자 권한 설정
GRANT ALL PRIVILEGES ON DATABASE main TO postgres;

-- 5. Enum 타입 생성
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "RecommendationType" AS ENUM ('FREE', 'PREMIUM');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'USER_CANCELLED', 'REFUNDED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'USER_CANCELLED', 'REFUNDED');
CREATE TYPE "SocialProvider" AS ENUM ('KAKAO', 'GOOGLE', 'NAVER');
CREATE TYPE "BoardCategory" AS ENUM ('NOTICE', 'SUGGESTION', 'PARTNERSHIP');
CREATE TYPE "SubscriptionType" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');

-- 6. 테이블 생성
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "termsAgreed" BOOLEAN NOT NULL DEFAULT false,
    "privacyAgreed" BOOLEAN NOT NULL DEFAULT false,
    "marketingAgreed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "social_accounts" (
    "id" SERIAL NOT NULL,
    "provider" "SocialProvider" NOT NULL,
    "providerUid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_token_blacklist" (
    "jti" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "access_token_blacklist_pkey" PRIMARY KEY ("jti")
);

CREATE TABLE "recommendation_history" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "numbers" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recommendation_reviews" (
    "id" SERIAL NOT NULL,
    "recommendationId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recommendation_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "winning_numbers" (
    "id" SERIAL NOT NULL,
    "round" INTEGER NOT NULL,
    "drawDate" DATE NOT NULL,
    "numbers" TEXT NOT NULL,
    "bonusNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "winning_numbers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantUid" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "orderName" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "impUid" TEXT NOT NULL,
    "pgProvider" TEXT NOT NULL,
    "payMethod" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "board_posts" (
    "id" TEXT NOT NULL,
    "category" "BoardCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorId" TEXT,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "board_posts_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "ip_limit_records" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "lastRequestDate" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ip_limit_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- 7. 인덱스 생성
CREATE UNIQUE INDEX "social_accounts_provider_providerUid_key" ON "social_accounts"("provider", "providerUid");
CREATE INDEX "social_accounts_userId_idx" ON "social_accounts"("userId");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");
CREATE INDEX "access_token_blacklist_expiresAt_idx" ON "access_token_blacklist"("expiresAt");
CREATE INDEX "recommendation_history_userId_idx" ON "recommendation_history"("userId");
CREATE INDEX "recommendation_history_type_idx" ON "recommendation_history"("type");
CREATE INDEX "recommendation_reviews_recommendationId_idx" ON "recommendation_reviews"("recommendationId");
CREATE UNIQUE INDEX "winning_numbers_round_key" ON "winning_numbers"("round");
CREATE INDEX "winning_numbers_drawDate_idx" ON "winning_numbers"("drawDate");
CREATE UNIQUE INDEX "orders_merchantUid_key" ON "orders"("merchantUid");
CREATE INDEX "orders_userId_idx" ON "orders"("userId");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE UNIQUE INDEX "payments_impUid_key" ON "payments"("impUid");
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "board_posts_category_idx" ON "board_posts"("category");
CREATE INDEX "board_posts_isImportant_idx" ON "board_posts"("isImportant");
CREATE INDEX "board_posts_createdAt_idx" ON "board_posts"("createdAt");
CREATE INDEX "board_posts_authorId_idx" ON "board_posts"("authorId");
CREATE INDEX "api_usage_endpoint_idx" ON "api_usage"("endpoint");
CREATE INDEX "api_usage_createdAt_idx" ON "api_usage"("createdAt");
CREATE INDEX "ip_limit_records_ipAddress_lastRequestDate_idx" ON "ip_limit_records"("ipAddress", "lastRequestDate");
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- 8. 외래키 제약조건
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recommendation_history" ADD CONSTRAINT "recommendation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recommendation_reviews" ADD CONSTRAINT "recommendation_reviews_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendation_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. 로그 메시지
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL 초기화 완료 - 데이터베이스: main';
    RAISE NOTICE '모든 테이블, 인덱스, 외래키가 생성되었습니다.';
END $$; 
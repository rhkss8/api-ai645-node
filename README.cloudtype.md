# 클라우드타입 배포 가이드

## 🚀 빠른 배포

### 1. 환경변수 설정
클라우드타입 대시보드에서 다음 환경변수를 설정하세요:

```bash
NODE_ENV=production
PORT=3350
DATABASE_URL=postgresql://root:tarscase12%21%40@svc.sel5.cloudtype.app:31473/main
JWT_SECRET=ai-645-jwt-sct
JWT_PRIVATE_KEY_B64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2Z0lCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktnd2dnU2tBZ0VBQW9JQkFRQ3VxUmQ5VU0xNEJqNHgKaTVHckFYVUFYd0l1QXRraUlKVjV0RGxCUFdid0NmYllZTGtUY255QlZSb1dsS3E5ZUhUT3NUVXE5Zk9XMEJLZgo4Ty8wR2V1MVZDUTFVVnRXNVlPOVI3b01KcWE0bDR3RXZiaTZpa2JYUlozLzBhQ2ZvMzNrb00zd1J6YWo3Z2tuClhFelRXSFdVRlJVajZyQnFMY1RNcVlmR2VqWnY4akhqWi9HbXpRQlAyUmR0QlRFUjBSSWhrOSthQk5nUEFTbDkKem56OEIyVzFXQzc2ODlPRnFtdXBQUHZtS0d6c3ZvQTU0NC85MVB4b2NLYk56WkxPdmFEOGpxQUpMNEVydUMzawo3cVFUQU16eUZKWDVaMTNzTEF5K3grQ0Z2TnZML3BobUxqUkwvSEZjVlhCTHBnRk92QWM1TW9hUFZQc0xBN1M5CnpZNUFhbCszQWdNQkFBRUNnZ0VBQlpNckhKcGUwZVVYeU1WazJHUlFXT1hhR3NyYzBHSGhpTmx2b2IxS2ZhdEIKRlp0U0VrOVdCRnQwTWpmN2tvR2lSTk5UZ3ZRSHhZNjRVWGVZeVIzOHI5OG9LcldCUGdSUEVLbkFtVkVGMkVyVQpzc3ExZDBBZytRKzZvU2JqN1c4dXFRU3RuaGVWSkdWZGV4bFBSY2hZaWI5UE1KbDE3bVd0N0Q4VnNOMmN3dCtXCnJiZnJod29OV2kwRXF2Q1o4VzdFK1FjNVFjNi90VGRGZi8xYnhXZzlzR0EyQWZic1RtT01hOG1wOWpaS0NHNEEKZkZ2a01xN3J5SU04T29XNmxlVkIrN3RTaUQ1K2tGYzR3Zk5VbTFxK1JjUDVaZUFQdEF5WVdKNS83Y3M2bGczbwpPRFNKZ09odUhjL0FQTUwzcU5lalh2djVwd2ViZTREaVdvWTRWRmZ1UVFLQmdRRDB2UlVmUmtOZEtjbC9SMCtpCjlmdjJhTUkwTjhpeUpGNmlZVEtnWWFBQlR5QVZpZHhzb2FrSThXRjN6emozRVZuV2x3TEpKOG5CeDJaOXdoSkMKWnFkWDNnUEZ3QURTcGxqZitOZUlMSVUrQ0ZTc0l4aVpWNUJObG94TTNwbGRBZVc5RG1IN3pJdXBEdzcrRDc2KwpBUHl1RWJzVlBLUzF6UXV0ODhPeFJEREhkd0tCZ1FDMnNvVFlhMlk5NUR4bm9PU3FaUmVTbEE5MUN2b1BobkxMCkZTa3pMT1JmTkVlWVJKTGZEUHJjakQwZjlPSUNZbXBuakJ3ZjFxbGVqbEFzWVRoRm56S3NJR2JobWFUM1BEdzYKODluRTB3QnRnSWlFSXdaajk4THIzRy9PbXIwT2tvNjNlTDkzc1pxM0dTTUlDL3lXVWt6Z05PZ09sT0tXZlVHSQptd1BTd2ptNXdRS0JnRmczZTlDZEhCVU54ZkxaK291c0RSbGg0M2E5RU51ZG5ucjdmQ3N4WldKemFnWTVmam10Ci8rY1lVdUREMGkzRWxGUjBkRzJicU83dmVETW1iRHlCRWhyckRRTVAxWHdZdC9wcmtRMGx0eFdJSFRVN0pWZkkKcDF4QVF1eEdaSk9RNW9YQ0ZIR1Y1bFdXOXZsL0pXc0pvZ3NBbXlYcGlSbDdBcFcrUXpDM2VybTdBb0dCQUkxcwpOVTkrRzUvdlRCNy91ZUo0N0wxblpXdTV1b1pJRWhaSVpDTWNMZy9RWFZkdVJhN3Awa3JsTisvRDFTdjVXTnFjCjU2eHhzNXZoV0FoeW5XZXZhejg0dWNzSzcxcit3clR6ekhBQzBjTHlDenNXRGIxV3JnbDhFd1NBWGJhcEZsYkoKM3BUZDQ2QzJrWnFLQk5Xc0VaeEErQjFKZlBqM0xzSjdGSU9TRzdOQkFvR0JBSW5rcmRYbFkxWFNxM1NaYzd2dgp
JWT_PUBLIC_KEY_B64=LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFycWtYZlZETmVBWStNWXVScXdGMQpBRjhDTGdMWklpQ1ZlYlE1UVQxbThBbjIyR0M1RTNKOGdWVWFGcFNxdlhoMHpyRTFLdlh6bHRBU24vRHY5Qm5yCnRWUWtOVkZiVnVXRHZVZTZEQ2FtdUplTUJMMjR1b3BHMTBXZC85R2duNk45NUtETjhFYzJvKzRKSjF4TTAxaDEKbEJVVkkrcXdhaTNFekttSHhubzJiL0l4NDJmeHBzMEFUOWtYYlFVeEVkRVNJWlBmbWdUWUR3RXBmYzU4L0FkbAp0Vmd1K3ZQVGhhcHJxVHo3NWloczdMNkFPZU9QL2RUOGFIQ216YzJTenIyZy9JNmdDUytCSzdndDVPNmtFd0RNCjhoU1YrV2RkN0N3TXZzZmdoYnpieS82WVppNDBTL3h4WEZWd1M2WUJUcndIT1RLR2oxVDdDd08wdmMyT1FHcGYKdHdJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==
OPENAI_API_KEY=your-openai-api-key
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
OAUTH_REDIRECT_URI=https://api.44tune.co.kr/api/auth
PORTONE_IMP_KEY=your-portone-imp-key
PORTONE_IMP_SECRET=your-portone-imp-secret
CORS_ORIGIN=https://api.44tune.co.kr,https://44tune.co.kr,https://www.44tune.co.kr
```

### 2. 데이터베이스 설정

클라우드타입 PostgreSQL에 연결하여 다음 SQL을 실행하세요:

```sql
-- 1. main 데이터베이스 생성
CREATE DATABASE main;

-- 2. main 데이터베이스로 연결
\c main

-- 3. Enum 타입 생성
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "RecommendationType" AS ENUM ('FREE', 'PREMIUM');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'USER_CANCELLED', 'REFUNDED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'USER_CANCELLED', 'REFUNDED');
CREATE TYPE "SocialProvider" AS ENUM ('KAKAO', 'GOOGLE', 'NAVER');
CREATE TYPE "BoardCategory" AS ENUM ('NOTICE', 'SUGGESTION', 'PARTNERSHIP');
CREATE TYPE "SubscriptionType" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');

-- 4. 테이블 생성
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

-- 5. 인덱스 생성
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

-- 6. 외래키 제약조건
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recommendation_history" ADD CONSTRAINT "recommendation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recommendation_reviews" ADD CONSTRAINT "recommendation_reviews_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendation_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 3. 배포

1. 클라우드타입 대시보드에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. `cloudtype.yaml` 파일로 배포
4. 환경변수 설정
5. 배포 실행

### 4. 확인사항

배포 후 다음 로그가 나타나는지 확인하세요:
- ✅ 데이터베이스 연결 성공
- ✅ Prisma 마이그레이션 완료
- ✅ Prisma 클라이언트 생성
- 🚀 TypeScript 로또 추천 API 서버가 시작되었습니다!

### 5. API 테스트

배포 완료 후 다음 엔드포인트를 테스트하세요:
- Health Check: `GET /health`
- API Docs: `GET /api-docs`
- 소셜 로그인: `GET /api/auth/kakao` 
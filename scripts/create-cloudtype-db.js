const { Client } = require('pg');

async function createCloudTypeDatabase() {
  console.log('🔧 클라우드타입 PostgreSQL 설정 시작...');

  // 1. postgres 데이터베이스에 연결해서 main 데이터베이스 생성
  const postgresClient = new Client({
    host: 'svc.sel5.cloudtype.app',
    port: 31473,
    user: 'root',
    password: 'tarscase12!@',
    database: 'postgres'
  });

  try {
    await postgresClient.connect();
    console.log('✅ postgres 데이터베이스에 연결 성공');

    // main 데이터베이스 생성
    try {
      await postgresClient.query('CREATE DATABASE main');
      console.log('✅ main 데이터베이스 생성 완료');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('⚠️  main 데이터베이스가 이미 존재합니다');
      } else {
        throw error;
      }
    }

    await postgresClient.end();

    // 2. main 데이터베이스에 연결해서 스키마 적용
    const mainClient = new Client({
      host: 'svc.sel5.cloudtype.app',
      port: 31473,
      user: 'root',
      password: 'tarscase12!@',
      database: 'main'
    });

    await mainClient.connect();
    console.log('✅ main 데이터베이스에 연결 성공');

    // 3. Prisma 스키마를 기반으로 테이블 생성
    const createTablesSQL = `
      -- Users 테이블
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" TEXT NOT NULL,
        "nickname" VARCHAR(40) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
        "termsAgreed" BOOLEAN NOT NULL DEFAULT false,
        "privacyAgreed" BOOLEAN NOT NULL DEFAULT false,
        "marketingAgreed" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );

      -- SocialAccount 테이블
      CREATE TABLE IF NOT EXISTS "public"."social_accounts" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "provider" "public"."AuthProvider" NOT NULL,
        "providerUid" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
      );

      -- RefreshToken 테이블
      CREATE TABLE IF NOT EXISTS "public"."refresh_tokens" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
      );

      -- AccessTokenBlacklist 테이블
      CREATE TABLE IF NOT EXISTS "public"."access_token_blacklist" (
        "jti" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "access_token_blacklist_pkey" PRIMARY KEY ("jti")
      );

      -- Order 테이블
      CREATE TABLE IF NOT EXISTS "public"."orders" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "merchantUid" TEXT NOT NULL,
        "orderName" TEXT NOT NULL DEFAULT '로또 추천 서비스',
        "amount" INTEGER NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'KRW',
        "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
        "description" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
      );

      -- Payment 테이블
      CREATE TABLE IF NOT EXISTS "public"."payments" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "impUid" TEXT NOT NULL,
        "pgProvider" TEXT NOT NULL,
        "payMethod" TEXT NOT NULL,
        "amount" INTEGER NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'KRW',
        "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "paidAt" TIMESTAMP(3),
        "rawResponse" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
      );

      -- Subscription 테이블
      CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" "public"."SubscriptionType" NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'active',
        "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endDate" TIMESTAMP(3) NOT NULL,
        "autoRenew" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
      );

      -- BoardPost 테이블
      CREATE TABLE IF NOT EXISTS "public"."board_posts" (
        "id" TEXT NOT NULL,
        "category" "public"."BoardCategory" NOT NULL,
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

      -- RecommendationHistory 테이블
      CREATE TABLE IF NOT EXISTS "public"."recommendation_history" (
        "id" TEXT NOT NULL,
        "round" INTEGER,
        "numbers" JSONB NOT NULL,
        "type" "public"."RecommendationType" NOT NULL,
        "conditions" JSONB,
        "imageData" JSONB,
        "gptModel" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "analysis" TEXT,
        "userId" TEXT,
        CONSTRAINT "recommendation_history_pkey" PRIMARY KEY ("id")
      );

      -- RecommendationReview 테이블
      CREATE TABLE IF NOT EXISTS "public"."recommendation_review" (
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

      -- WinningNumbers 테이블
      CREATE TABLE IF NOT EXISTS "public"."winning_numbers" (
        "id" TEXT NOT NULL,
        "round" INTEGER NOT NULL,
        "numbers" JSONB NOT NULL,
        "drawDate" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "bonusNumber" INTEGER NOT NULL,
        "firstWinningAmount" BIGINT NOT NULL,
        CONSTRAINT "winning_numbers_pkey" PRIMARY KEY ("id")
      );

      -- ApiUsage 테이블
      CREATE TABLE IF NOT EXISTS "public"."api_usage" (
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

      -- IPLimitRecord 테이블
      CREATE TABLE IF NOT EXISTS "public"."ip_limit_records" (
        "id" TEXT NOT NULL,
        "ipAddress" TEXT NOT NULL,
        "lastRequestDate" TEXT NOT NULL,
        "requestCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "ip_limit_records_pkey" PRIMARY KEY ("id")
      );
    `;

    await mainClient.query(createTablesSQL);
    console.log('✅ 테이블 생성 완료');

    // 4. 인덱스 생성
    const createIndexesSQL = `
      -- Orders 인덱스
      CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "public"."orders"("userId");
      CREATE INDEX IF NOT EXISTS "orders_merchantUid_idx" ON "public"."orders"("merchantUid");
      CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "public"."orders"("status");
      CREATE INDEX IF NOT EXISTS "orders_createdAt_idx" ON "public"."orders"("createdAt");

      -- Payments 인덱스
      CREATE INDEX IF NOT EXISTS "payments_impUid_idx" ON "public"."payments"("impUid");
      CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "public"."payments"("status");
      CREATE INDEX IF NOT EXISTS "payments_paidAt_idx" ON "public"."payments"("paidAt");

      -- BoardPosts 인덱스
      CREATE INDEX IF NOT EXISTS "board_posts_category_idx" ON "public"."board_posts"("category");
      CREATE INDEX IF NOT EXISTS "board_posts_isImportant_idx" ON "public"."board_posts"("isImportant");
      CREATE INDEX IF NOT EXISTS "board_posts_createdAt_idx" ON "public"."board_posts"("createdAt");
      CREATE INDEX IF NOT EXISTS "board_posts_authorId_idx" ON "public"."board_posts"("authorId");

      -- IPLimitRecords 인덱스
      CREATE INDEX IF NOT EXISTS "ip_limit_records_ipAddress_lastRequestDate_idx" ON "public"."ip_limit_records"("ipAddress", "lastRequestDate");

      -- SocialAccounts 유니크 제약조건
      ALTER TABLE "public"."social_accounts" ADD CONSTRAINT IF NOT EXISTS "social_accounts_provider_providerUid_key" UNIQUE ("provider", "providerUid");

      -- RefreshTokens 유니크 제약조건
      ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT IF NOT EXISTS "refresh_tokens_tokenHash_key" UNIQUE ("tokenHash");

      -- Orders 유니크 제약조건
      ALTER TABLE "public"."orders" ADD CONSTRAINT IF NOT EXISTS "orders_merchantUid_key" UNIQUE ("merchantUid");

      -- Payments 유니크 제약조건
      ALTER TABLE "public"."payments" ADD CONSTRAINT IF NOT EXISTS "payments_orderId_key" UNIQUE ("orderId");
      ALTER TABLE "public"."payments" ADD CONSTRAINT IF NOT EXISTS "payments_impUid_key" UNIQUE ("impUid");

      -- WinningNumbers 유니크 제약조건
      ALTER TABLE "public"."winning_numbers" ADD CONSTRAINT IF NOT EXISTS "winning_numbers_round_key" UNIQUE ("round");

      -- IPLimitRecords 유니크 제약조건
      ALTER TABLE "public"."ip_limit_records" ADD CONSTRAINT IF NOT EXISTS "ip_limit_records_ipAddress_key" UNIQUE ("ipAddress");
    `;

    await mainClient.query(createIndexesSQL);
    console.log('✅ 인덱스 생성 완료');

    // 5. 외래키 제약조건 추가
    const createForeignKeysSQL = `
      -- SocialAccounts 외래키
      ALTER TABLE "public"."social_accounts" ADD CONSTRAINT IF NOT EXISTS "social_accounts_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

      -- RefreshTokens 외래키
      ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT IF NOT EXISTS "refresh_tokens_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

      -- Orders 외래키
      ALTER TABLE "public"."orders" ADD CONSTRAINT IF NOT EXISTS "orders_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

      -- Payments 외래키
      ALTER TABLE "public"."payments" ADD CONSTRAINT IF NOT EXISTS "payments_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

      -- Subscriptions 외래키
      ALTER TABLE "public"."subscriptions" ADD CONSTRAINT IF NOT EXISTS "subscriptions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

      -- BoardPosts 외래키
      ALTER TABLE "public"."board_posts" ADD CONSTRAINT IF NOT EXISTS "board_posts_authorId_fkey" 
        FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

      -- RecommendationHistory 외래키
      ALTER TABLE "public"."recommendation_history" ADD CONSTRAINT IF NOT EXISTS "recommendation_history_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

      -- RecommendationReview 외래키
      ALTER TABLE "public"."recommendation_review" ADD CONSTRAINT IF NOT EXISTS "recommendation_review_recommendationId_fkey" 
        FOREIGN KEY ("recommendationId") REFERENCES "public"."recommendation_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;

    await mainClient.query(createForeignKeysSQL);
    console.log('✅ 외래키 제약조건 추가 완료');

    await mainClient.end();
    console.log('✅ 클라우드타입 PostgreSQL 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createCloudTypeDatabase(); 
const { Client } = require('pg');

async function createEnums() {
  console.log('🔧 클라우드타입 PostgreSQL Enum 타입 생성 시작...');

  const client = new Client({
    host: 'svc.sel5.cloudtype.app',
    port: 31473,
    user: 'root',
    password: 'tarscase12!@',
    database: 'main'
  });

  try {
    await client.connect();
    console.log('✅ main 데이터베이스에 연결 성공');

    // Enum 타입들 생성
    const createEnumsSQL = `
      -- RecommendationType Enum
      DO $$ BEGIN
        CREATE TYPE "public"."RecommendationType" AS ENUM ('FREE', 'PREMIUM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- AuthProvider Enum
      DO $$ BEGIN
        CREATE TYPE "public"."AuthProvider" AS ENUM ('EMAIL', 'KAKAO', 'GOOGLE', 'NAVER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- UserRole Enum
      DO $$ BEGIN
        CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- BoardCategory Enum
      DO $$ BEGIN
        CREATE TYPE "public"."BoardCategory" AS ENUM ('NOTICE', 'SUGGESTION', 'PARTNERSHIP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- OrderStatus Enum
      DO $$ BEGIN
        CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'USER_CANCELLED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- PaymentStatus Enum
      DO $$ BEGIN
        CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'USER_CANCELLED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- SubscriptionType Enum
      DO $$ BEGIN
        CREATE TYPE "public"."SubscriptionType" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await client.query(createEnumsSQL);
    console.log('✅ Enum 타입 생성 완료');

    await client.end();
    console.log('✅ 클라우드타입 PostgreSQL Enum 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createEnums(); 
const { Client } = require('pg');

async function setupCloudTypeDatabase() {
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

    // 2. main 데이터베이스에 연결해서 Enum 타입들 생성
    const mainClient = new Client({
      host: 'svc.sel5.cloudtype.app',
      port: 31473,
      user: 'root',
      password: 'tarscase12!@',
      database: 'main'
    });

    await mainClient.connect();
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

    await mainClient.query(createEnumsSQL);
    console.log('✅ Enum 타입 생성 완료');

    // 3. Prisma db push 실행
    console.log('🚀 Prisma db push 실행 중...');
    const { execSync } = require('child_process');
    
    // 환경변수 설정
    process.env.DATABASE_URL = 'postgresql://root:tarscase12%21%40@svc.sel5.cloudtype.app:31473/main';
    
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Prisma db push 완료');
    } catch (error) {
      console.log('⚠️  Prisma db push 실패, 수동으로 실행해주세요');
    }

    await mainClient.end();
    console.log('✅ 클라우드타입 PostgreSQL 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

setupCloudTypeDatabase(); 
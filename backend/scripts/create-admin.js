const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // 기존 관리자 확인
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        deletedAt: null,
      },
    });

    if (existingAdmin) {
      console.log('이미 관리자가 존재합니다:');
      console.log(`- ID: ${existingAdmin.id}`);
      console.log(`- 닉네임: ${existingAdmin.nickname}`);
      console.log(`- 역할: ${existingAdmin.role}`);
      console.log(`- 생성일: ${existingAdmin.createdAt}`);
      return;
    }

    // 관리자 사용자 생성
    const adminUser = await prisma.user.create({
      data: {
        nickname: '관리자',
        role: 'ADMIN',
      },
    });

    console.log('관리자 사용자가 성공적으로 생성되었습니다:');
    console.log(`- ID: ${adminUser.id}`);
    console.log(`- 닉네임: ${adminUser.nickname}`);
    console.log(`- 역할: ${adminUser.role}`);
    console.log(`- 생성일: ${adminUser.createdAt}`);

    console.log('\n관리자 API 테스트 방법:');
    console.log('1. 소셜 로그인으로 계정 생성');
    console.log('2. Prisma Studio에서 해당 사용자의 role을 ADMIN으로 변경');
    console.log('3. 관리자 API 테스트:');
    console.log('   - GET /api/admin/users');
    console.log('   - GET /api/admin/stats/api');
    console.log('   - GET /api/admin/status');

  } catch (error) {
    console.error('관리자 생성 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
createAdminUser(); 
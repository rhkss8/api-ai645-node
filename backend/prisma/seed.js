const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// 임시 해싱 함수 (결제 심사용)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'ai645_salt').digest('hex');
}

async function main() {
  console.log('🌱 데이터베이스 시드 시작...');

  let existingUser = null; // 스코프 문제 해결을 위해 상위에 선언

  try {
    // 1. 기본 이메일 계정 생성
    console.log('📧 기본 이메일 계정 생성 중...');

    try {
      existingUser = await prisma.user.findUnique({
        where: { email: '44tune@44tune.co.kr' }
      });

      if (!existingUser) {
        const defaultUser = await prisma.user.create({
          data: {
            email: '44tune@44tune.co.kr',
            password: hashPassword('ai645!'),
            nickname: '포포춘관리자',
            termsAgreed: true,
            privacyAgreed: true,
            marketingAgreed: false,
            role: 'USER'
          }
        });
        console.log('✅ 기본 이메일 계정 생성 완료:', defaultUser.email);
        existingUser = defaultUser; // 생성된 사용자로 업데이트
      } else {
        console.log('⚠️ 기본 이메일 계정이 이미 존재합니다:', existingUser.email);
      }
    } catch (error) {
      console.error('❌ 기본 이메일 계정 생성 실패:', error);
      console.error('   상세 오류:', error.message);
      console.error('   스택:', error.stack);
      console.log('⚠️ 계속 진행합니다...');
    }

    // 최종 확인
    const finalCheck = await prisma.user.findUnique({
      where: { email: '44tune@44tune.co.kr' }
    });

    console.log('🎉 데이터베이스 시드 완료!');
    console.log('');
    console.log('📋 생성된 데이터:');
    if (finalCheck) {
      console.log('✅ 기본 이메일 계정: 44tune@44tune.co.kr (생성됨)');
    } else {
      console.log('⚠️ 기본 이메일 계정: 44tune@44tune.co.kr (생성 실패)');
    }
    console.log('');
    if (finalCheck) {
      console.log('🔗 관리자 계정:');
      console.log('이메일: 44tune@44tune.co.kr');
      console.log('비밀번호: ai645!');
      console.log('닉네임: 포포춘관리자');
    } else {
      console.log('⚠️ 관리자 계정이 생성되지 않았습니다.');
      console.log('💡 수동으로 생성하세요: node scripts/create-temp-account.js');
    }

  } catch (error) {
    console.error('❌ 시드 실행 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ 시드 실행 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

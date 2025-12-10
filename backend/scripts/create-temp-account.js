const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// 임시 해싱 함수 (결제 심사용)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'ai645_salt').digest('hex');
}

async function createTempAccount() {
  const prisma = new PrismaClient();

  try {
    console.log('🔐 임시 계정 생성을 시작합니다...');

    const email = '44tune@44tune.co.kr';
    const password = 'ai645!';
    const nickname = '포포춘관리자';

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️ 이미 존재하는 계정입니다:', email);
      console.log('📋 기존 계정 정보:');
      console.log('   - ID:', existingUser.id);
      console.log('   - 이메일:', existingUser.email);
      console.log('   - 닉네임:', existingUser.nickname);
      console.log('   - 생성일:', existingUser.createdAt);
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        termsAgreed: true,
        privacyAgreed: true,
        marketingAgreed: false,
        role: 'USER',
      },
    });

    console.log('✅ 임시 계정이 생성되었습니다!');
    console.log('📋 계정 정보:');
    console.log('   - ID:', user.id);
    console.log('   - 이메일:', email);
    console.log('   - 비밀번호:', password);
    console.log('   - 닉네임:', nickname);
    console.log('   - 생성일:', user.createdAt);
    console.log('');
    console.log('🔗 로그인 테스트:');
    console.log('   POST /api/auth/temp-login');
    console.log('   Body: {"email":"' + email + '","password":"' + password + '"}');

  } catch (error) {
    console.error('❌ 임시 계정 생성 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 환경변수로 계정 정보 설정 가능
async function createCustomAccount() {
  const prisma = new PrismaClient();

  try {
    const email = process.env.TEMP_EMAIL || '44tune@44tune.co.kr';
    const password = process.env.TEMP_PASSWORD || 'ai645!';
    const nickname = process.env.TEMP_NICKNAME || '포포춘관리자';

    console.log('🔐 사용자 정의 임시 계정 생성을 시작합니다...');
    console.log('📧 이메일:', email);
    console.log('👤 닉네임:', nickname);

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️ 이미 존재하는 계정입니다:', email);
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = hashPassword(password);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        termsAgreed: true,
        privacyAgreed: true,
        marketingAgreed: false,
        role: 'USER',
      },
    });

    console.log('✅ 사용자 정의 임시 계정이 생성되었습니다!');
    console.log('📋 계정 정보:');
    console.log('   - ID:', user.id);
    console.log('   - 이메일:', email);
    console.log('   - 비밀번호:', password);
    console.log('   - 닉네임:', nickname);

  } catch (error) {
    console.error('❌ 사용자 정의 임시 계정 생성 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 명령행 인수 확인
const args = process.argv.slice(2);
const command = args[0];

if (command === 'custom') {
  createCustomAccount();
} else {
  createTempAccount();
}

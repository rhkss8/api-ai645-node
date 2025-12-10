const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// 임시 해싱 함수 (결제 심사용)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'ai645_salt').digest('hex');
}

async function main() {
  console.log('🌱 데이터베이스 시드 시작...');

  try {
    // 1. 기본 이메일 계정 생성
    console.log('📧 기본 이메일 계정 생성 중...');

    try {
      const existingUser = await prisma.user.findUnique({
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
      } else {
        console.log('⚠️ 기본 이메일 계정이 이미 존재합니다:', existingUser.email);
      }
    } catch (error) {
      console.error('❌ 기본 이메일 계정 생성 실패:', error);
      console.log('⚠️ 계속 진행합니다...');
    }

    // 2. 초기 당첨번호 데이터 생성
    console.log('🎯 초기 당첨번호 데이터 생성 중...');

    // 최근 10회차의 샘플 당첨번호 생성
    const sampleWinningNumbers = [
      {
        round: 1182,
        numbers: [1, 13, 21, 25, 28, 31],
        bonusNumber: 22,
        drawDate: new Date('2025-07-26'),
        firstWinningAmount: BigInt(2124785424)
      },
      {
        round: 1181,
        numbers: [8, 10, 14, 20, 33, 41],
        bonusNumber: 28,
        drawDate: new Date('2025-07-19'),
        firstWinningAmount: BigInt(1593643500)
      },
      {
        round: 1180,
        numbers: [3, 7, 11, 15, 29, 35],
        bonusNumber: 42,
        drawDate: new Date('2025-07-12'),
        firstWinningAmount: BigInt(1850000000)
      },
      {
        round: 1179,
        numbers: [2, 9, 16, 24, 30, 38],
        bonusNumber: 45,
        drawDate: new Date('2025-07-05'),
        firstWinningAmount: BigInt(1950000000)
      },
      {
        round: 1178,
        numbers: [4, 12, 18, 26, 32, 40],
        bonusNumber: 44,
        drawDate: new Date('2025-06-28'),
        firstWinningAmount: BigInt(2100000000)
      }
    ];

    for (const winningData of sampleWinningNumbers) {
      const existingWinning = await prisma.winningNumbers.findUnique({
        where: { round: winningData.round }
      });

      if (!existingWinning) {
        await prisma.winningNumbers.create({
          data: {
            round: winningData.round,
            numbers: winningData.numbers,
            bonusNumber: winningData.bonusNumber,
            drawDate: winningData.drawDate,
            firstWinningAmount: winningData.firstWinningAmount
          }
        });
        console.log(`✅ 회차 ${winningData.round} 당첨번호 생성 완료`);
      } else {
        console.log(`⚠️ 회차 ${winningData.round} 당첨번호가 이미 존재합니다`);
      }
    }

    // 3. 샘플 추천 파라미터 생성
    console.log('📊 샘플 추천 파라미터 생성 중...');

    const sampleParams = await prisma.recommendationParams.create({
      data: {
        conditions: {
          includeNumbers: [1, 7, 15, 23, 35, 42],
          excludeNumbers: [4, 8, 12, 16, 20, 24],
          gameCount: 5
        },
        status: 'PENDING',
        userId: existingUser ? existingUser.id : null
      }
    });
    console.log('✅ 샘플 추천 파라미터 생성 완료');

    console.log('🎉 데이터베이스 시드 완료!');
    console.log('');
    console.log('📋 생성된 데이터:');
    console.log('- 기본 이메일 계정: 44tune@44tune.co.kr');
    console.log('- 샘플 당첨번호: 5회차');
    console.log('- 샘플 추천 파라미터: 1개');
    console.log('');
    console.log('🔗 테스트 계정:');
    console.log('이메일: 44tune@44tune.co.kr');
    console.log('비밀번호: ai645!');

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

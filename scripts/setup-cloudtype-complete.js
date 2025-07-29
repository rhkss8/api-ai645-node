const { execSync } = require('child_process');
const path = require('path');

async function setupCloudTypeDatabase() {
  console.log('🚀 클라우드타입 PostgreSQL 완전 설정 시작...');

  try {
    // 1. Enum 타입들 생성
    console.log('\n📦 1단계: Enum 타입 생성 중...');
    execSync('node scripts/create-enums.js', { stdio: 'inherit' });

    // 2. 테이블 및 스키마 생성
    console.log('\n📦 2단계: 테이블 및 스키마 생성 중...');
    execSync('node scripts/create-cloudtype-db.js', { stdio: 'inherit' });

    // 3. 초기 데이터 삽입 (선택사항)
    console.log('\n📦 3단계: 초기 데이터 삽입 중...');
    try {
      execSync('node scripts/importWinningNumbers.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  초기 데이터 삽입 실패 (선택사항이므로 계속 진행)');
    }

    console.log('\n✅ 클라우드타입 PostgreSQL 완전 설정 완료!');
    console.log('🎉 이제 애플리케이션을 배포할 수 있습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

setupCloudTypeDatabase(); 
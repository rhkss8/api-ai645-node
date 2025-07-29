const axios = require('axios');

// 테스트용 함수
async function testProfileAPI() {
  try {
    console.log('🔍 프로필 API 테스트 시작...');
    
    // 1. 먼저 인증이 필요한지 확인 (토큰 없이 요청)
    console.log('\n1️⃣ 토큰 없이 프로필 API 호출 (401 에러 예상)...');
    try {
      const response = await axios.get('http://localhost:3350/api/auth/profile');
      console.log('❌ 예상과 다름:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 예상대로 401 에러 발생:', error.response.data);
      } else {
        console.log('❌ 예상과 다른 에러:', error.response?.data);
      }
    }

    // 2. 잘못된 토큰으로 요청
    console.log('\n2️⃣ 잘못된 토큰으로 프로필 API 호출...');
    try {
      const response = await axios.get('http://localhost:3350/api/auth/profile', {
        headers: {
          'Authorization': 'Bearer invalid_token_here'
        }
      });
      console.log('❌ 예상과 다름:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 예상대로 401 에러 발생:', error.response.data);
      } else {
        console.log('❌ 예상과 다른 에러:', error.response?.data);
      }
    }

    console.log('\n📝 테스트 완료!');
    console.log('💡 실제 테스트를 위해서는:');
    console.log('   1. 소셜 로그인을 통해 유효한 토큰을 얻으세요');
    console.log('   2. 해당 토큰으로 /api/auth/profile API를 호출하세요');
    console.log('   3. 응답에서 authType과 socialAccounts 정보를 확인하세요');
    console.log('\n🔗 소셜 로그인 URL:');
    console.log('   - 카카오: http://localhost:3350/api/auth/kakao');
    console.log('   - 구글: http://localhost:3350/api/auth/google');
    console.log('   - 네이버: http://localhost:3350/api/auth/naver');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

// 실제 토큰으로 테스트하는 함수
async function testWithRealToken(token) {
  try {
    console.log('\n🔐 실제 토큰으로 프로필 API 테스트...');
    
    const response = await axios.get('http://localhost:3350/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 성공! 응답 데이터:');
    console.log(JSON.stringify(response.data, null, 2));

    // 응답 구조 확인
    const { data } = response.data;
    if (data) {
      console.log('\n📊 응답 구조 분석:');
      console.log(`- 사용자 ID: ${data.id}`);
      console.log(`- 닉네임: ${data.nickname}`);
      console.log(`- 인증 타입: ${data.authType}`);
      console.log(`- 소셜 계정 수: ${data.socialAccounts?.length || 0}`);
      console.log(`- 가입일: ${data.createdAt}`);
      
      if (data.socialAccounts && data.socialAccounts.length > 0) {
        console.log('\n🔗 연결된 소셜 계정:');
        data.socialAccounts.forEach((account, index) => {
          console.log(`  ${index + 1}. ${account.provider} (${account.providerUid}) - 연결일: ${account.connectedAt}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 토큰 테스트 실패:', error.response?.data || error.message);
  }
}

// 스크립트 실행
testProfileAPI();

// 실제 토큰이 있다면 여기서 테스트
// testWithRealToken('your_actual_token_here'); 
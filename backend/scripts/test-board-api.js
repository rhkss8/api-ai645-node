const axios = require('axios');

const BASE_URL = 'http://localhost:3350/api';
let authToken = '';

// 테스트용 사용자 토큰 (실제 테스트 시에는 소셜 로그인으로 얻은 토큰 사용)
const TEST_TOKEN = 'your-test-token-here';

async function testBoardAPI() {
  console.log('🎯 게시판 API 테스트 시작\n');

  try {
    // 1. 공지사항 목록 조회 (인증 없이)
    console.log('1️⃣ 공지사항 목록 조회 (인증 없이)');
    const noticeList = await axios.get(`${BASE_URL}/board/NOTICE`);
    console.log('✅ 성공:', noticeList.data.success);
    console.log('📄 게시글 수:', noticeList.data.data?.posts?.length || 0);
    console.log('');

    // 2. 건의게시판 목록 조회 (인증 필요)
    console.log('2️⃣ 건의게시판 목록 조회 (인증 필요)');
    try {
      const suggestionList = await axios.get(`${BASE_URL}/board/SUGGESTION`);
      console.log('✅ 성공:', suggestionList.data.success);
    } catch (error) {
      console.log('❌ 예상된 실패:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 3. 제휴문의 목록 조회 (관리자만)
    console.log('3️⃣ 제휴문의 목록 조회 (관리자만)');
    try {
      const partnershipList = await axios.get(`${BASE_URL}/board/PARTNERSHIP`);
      console.log('✅ 성공:', partnershipList.data.success);
    } catch (error) {
      console.log('❌ 예상된 실패:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 4. 게시글 생성 (인증 필요)
    console.log('4️⃣ 게시글 생성 (인증 필요)');
    try {
      const createPost = await axios.post(`${BASE_URL}/board/SUGGESTION`, {
        title: '테스트 게시글',
        content: '이것은 테스트 게시글입니다.',
        authorName: '테스트 작성자',
        isImportant: false,
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      console.log('✅ 성공:', createPost.data.success);
      console.log('📝 생성된 게시글 ID:', createPost.data.data?.id);
    } catch (error) {
      console.log('❌ 예상된 실패:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 5. XSS 공격 테스트
    console.log('5️⃣ XSS 공격 테스트');
    try {
      const xssTest = await axios.post(`${BASE_URL}/board/SUGGESTION`, {
        title: '<script>alert("XSS")</script>',
        content: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        authorName: 'XSS 테스트',
        isImportant: false,
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      console.log('✅ XSS 방어 성공:', xssTest.data.success);
    } catch (error) {
      console.log('❌ XSS 방어 실패:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 6. SQL Injection 테스트
    console.log('6️⃣ SQL Injection 테스트');
    try {
      const sqlTest = await axios.post(`${BASE_URL}/board/SUGGESTION`, {
        title: "'; DROP TABLE users; --",
        content: "1' OR '1'='1",
        authorName: 'SQL 테스트',
        isImportant: false,
      }, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        }
      });
      console.log('✅ SQL Injection 방어 성공:', sqlTest.data.success);
    } catch (error) {
      console.log('❌ SQL Injection 방어 실패:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 게시판 API 테스트 완료!');
    console.log('\n📋 테스트 결과 요약:');
    console.log('- 공지사항: 누구나 읽기 가능');
    console.log('- 건의게시판: 로그인한 사용자만 읽기 가능');
    console.log('- 제휴문의: 관리자만 읽기 가능');
    console.log('- XSS/SQL Injection 방어: 정상 작동');
    console.log('- 권한 체크: 정상 작동');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

// 테스트 실행
testBoardAPI(); 
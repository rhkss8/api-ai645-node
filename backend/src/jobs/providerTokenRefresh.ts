import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

/**
 * 카카오 토큰 갱신
 */
async function refreshKakaoToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const response = await axios.post('https://kauth.kakao.com/oauth/token', {
    grant_type: 'refresh_token',
    client_id: process.env.KAKAO_CLIENT_ID,
    client_secret: process.env.KAKAO_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  return response.data;
}

/**
 * 구글 토큰 갱신
 */
async function refreshGoogleToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    grant_type: 'refresh_token',
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  return response.data;
}

/**
 * 네이버 토큰 갱신
 */
async function refreshNaverToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const response = await axios.post('https://nid.naver.com/oauth2.0/token', {
    grant_type: 'refresh_token',
    client_id: process.env.NAVER_CLIENT_ID,
    client_secret: process.env.NAVER_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  return response.data;
}

/**
 * 소셜 계정 토큰 갱신
 */
async function refreshProviderToken(account: any): Promise<void> {
  try {
    console.log(`🔄 토큰 갱신 시작: ${account.provider} - ${account.providerUid}`);

    let tokenResponse: TokenRefreshResponse;

    switch (account.provider) {
      case 'KAKAO':
        tokenResponse = await refreshKakaoToken(account.refreshToken);
        break;
      case 'GOOGLE':
        tokenResponse = await refreshGoogleToken(account.refreshToken);
        break;
      case 'NAVER':
        tokenResponse = await refreshNaverToken(account.refreshToken);
        break;
      default:
        throw new Error(`지원하지 않는 제공자: ${account.provider}`);
    }

    // 새 토큰 암호화
    const bcrypt = await import('bcryptjs');
    const newAccessToken = await bcrypt.hash(tokenResponse.access_token, 10);
    const newRefreshToken = tokenResponse.refresh_token
      ? await bcrypt.hash(tokenResponse.refresh_token, 10)
      : account.refreshToken;

    // 만료 시간 계산
    const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));

    // DB 업데이트
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ 토큰 갱신 완료: ${account.provider} - ${account.providerUid}`);
  } catch (error) {
    console.error(`❌ 토큰 갱신 실패: ${account.provider} - ${account.providerUid}`, error);

    // 갱신 실패 시 계정 비활성화 또는 알림 처리
    // 여기서는 로그만 남기고 계속 진행
  }
}

/**
 * 토큰 갱신 워커 시작
 */
export function startTokenRefreshWorker(): void {
  console.log('🔄 소셜 토큰 갱신 워커 시작');

  // 6시간마다 실행 (매일 0시, 6시, 12시, 18시)
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('🔄 소셜 토큰 갱신 작업 시작');

      // 1시간 내에 만료될 토큰들 조회
      const soonExpiring = await prisma.socialAccount.findMany({
        where: {
          expiresAt: {
            lt: new Date(Date.now() + 3600 * 1000), // 1시간
          },
          refreshToken: {
            not: null,
          },
        },
      });

      console.log(`📊 갱신 대상: ${soonExpiring.length}개 계정`);

      // 각 계정의 토큰 갱신
      for (const account of soonExpiring) {
        await refreshProviderToken(account);
      }

      console.log('✅ 소셜 토큰 갱신 작업 완료');
    } catch (error) {
      console.error('❌ 소셜 토큰 갱신 작업 오류:', error);
    }
  });

  // 만료된 토큰 정리 (매일 자정)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🧹 만료된 토큰 정리 시작');

      // 만료된 액세스 토큰 블랙리스트 정리
      const deletedBlacklist = await prisma.accessTokenBlacklist.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      // 만료된 리프레시 토큰 정리
      const deletedRefreshTokens = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`🧹 정리 완료: 블랙리스트 ${deletedBlacklist.count}개, 리프레시 토큰 ${deletedRefreshTokens.count}개`);
    } catch (error) {
      console.error('❌ 토큰 정리 오류:', error);
    }
  });
}

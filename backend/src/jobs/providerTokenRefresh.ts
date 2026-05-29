import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import axios, { isAxiosError } from 'axios';
import {
  decryptOAuthToken,
  encryptOAuthToken,
  OauthEncryptionConfigError,
} from '../utils/oauthTokenCrypto';

const prisma = new PrismaClient();

interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

function oauthFormBody(params: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') {
      u.set(k, v);
    }
  }
  return u.toString();
}

async function postOAuthToken(url: string, body: string): Promise<TokenRefreshResponse> {
  const response = await axios.post<TokenRefreshResponse>(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    transformRequest: [(data) => data],
  });
  return response.data;
}

/**
 * 카카오 토큰 갱신
 */
async function refreshKakaoToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const body = oauthFormBody({
    grant_type: 'refresh_token',
    client_id: process.env.KAKAO_CLIENT_ID,
    client_secret: process.env.KAKAO_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
  return postOAuthToken('https://kauth.kakao.com/oauth/token', body);
}

/**
 * 구글 토큰 갱신
 */
async function refreshGoogleToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const body = oauthFormBody({
    grant_type: 'refresh_token',
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
  return postOAuthToken('https://oauth2.googleapis.com/token', body);
}

/**
 * 네이버 토큰 갱신
 */
async function refreshNaverToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const body = oauthFormBody({
    grant_type: 'refresh_token',
    client_id: process.env.NAVER_CLIENT_ID,
    client_secret: process.env.NAVER_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
  return postOAuthToken('https://nid.naver.com/oauth2.0/token', body);
}

function logTokenRefreshFailure(provider: string, providerUid: string, err: unknown): void {
  if (isAxiosError(err)) {
    console.error(`❌ 토큰 갱신 실패: ${provider} - ${providerUid}`, {
      status: err.response?.status,
      data: err.response?.data,
    });
    return;
  }
  console.error(
    `❌ 토큰 갱신 실패: ${provider} - ${providerUid}`,
    err instanceof Error ? err.message : String(err),
  );
}

/**
 * 소셜 계정 토큰 갱신
 */
async function refreshProviderToken(account: {
  id: string;
  provider: string;
  providerUid: string;
  refreshToken: string | null;
}): Promise<void> {
  try {
    console.log(`🔄 토큰 갱신 시작: ${account.provider} - ${account.providerUid}`);

    if (!account.refreshToken) {
      console.warn(`⏭️ 리프레시 토큰 없음, 건너뜀: ${account.provider} - ${account.providerUid}`);
      return;
    }

    let plainRefresh: string | null;
    try {
      plainRefresh = decryptOAuthToken(account.refreshToken);
    } catch (e) {
      if (e instanceof OauthEncryptionConfigError) {
        console.error('❌ OAUTH_TOKEN_ENCRYPTION_KEY 미설정 또는 형식 오류 — 갱신 중단');
        return;
      }
      throw e;
    }
    if (!plainRefresh) {
      console.warn(
        `⏭️ 저장된 리프레시 토큰을 복호화할 수 없습니다(구버전 해시 등). 재로그인 필요: ${account.provider} - ${account.providerUid}`,
      );
      return;
    }

    let tokenResponse: TokenRefreshResponse;

    switch (account.provider) {
      case 'KAKAO':
        tokenResponse = await refreshKakaoToken(plainRefresh);
        break;
      case 'GOOGLE':
        tokenResponse = await refreshGoogleToken(plainRefresh);
        break;
      case 'NAVER':
        tokenResponse = await refreshNaverToken(plainRefresh);
        break;
      default:
        throw new Error(`지원하지 않는 제공자: ${account.provider}`);
    }

    const newAccessToken = encryptOAuthToken(tokenResponse.access_token);
    const newRefreshToken = tokenResponse.refresh_token
      ? encryptOAuthToken(tokenResponse.refresh_token)
      : encryptOAuthToken(plainRefresh);

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

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
    logTokenRefreshFailure(account.provider, account.providerUid, error);
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
      console.error('❌ 소셜 토큰 갱신 작업 오류:', error instanceof Error ? error.message : error);
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
      console.error('❌ 토큰 정리 오류:', error instanceof Error ? error.message : error);
    }
  });
}

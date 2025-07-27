import passport from 'passport';
import KakaoStrategy from 'passport-kakao';
import GoogleStrategy from 'passport-google-oauth20';
import NaverStrategy from 'passport-naver';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

enum AuthProvider {
  KAKAO = 'KAKAO',
  GOOGLE = 'GOOGLE',
  NAVER = 'NAVER'
}

const prisma = new PrismaClient();

export interface SocialProfile {
  id: string;
  provider: AuthProvider;
  nickname: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * 소셜 계정 업서트 (사용자 생성 또는 연결)
 */
async function upsertSocialAccount(
  provider: AuthProvider,
  providerUid: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
  profile: any
): Promise<{ user: any; isNewUser: boolean }> {
  // 기존 소셜 계정 찾기
  let socialAccount = await prisma.socialAccount.findUnique({
    where: {
      provider_providerUid: {
        provider,
        providerUid,
      },
    },
    include: { user: true },
  });

  if (socialAccount) {
    // 기존 계정 업데이트
    await prisma.socialAccount.update({
      where: { id: socialAccount.id },
      data: {
        accessToken: await encryptToken(accessToken),
        refreshToken: refreshToken ? await encryptToken(refreshToken) : null,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    return { user: socialAccount.user, isNewUser: false };
  }

  // 새 사용자 생성
  const user = await prisma.user.create({
    data: {
      nickname: profile.nickname || `User_${Date.now()}`,
      socialAccounts: {
        create: {
          provider,
          providerUid,
          accessToken: await encryptToken(accessToken),
          refreshToken: refreshToken ? await encryptToken(refreshToken) : null,
          expiresAt,
        },
      },
    },
  });

  return { user, isNewUser: true };
}

/**
 * 토큰 암호화
 */
async function encryptToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * 토큰 복호화 (실제로는 해시 비교)
 */
async function verifyToken(hashedToken: string, plainToken: string): Promise<boolean> {
  return bcrypt.compare(plainToken, hashedToken);
}

/**
 * Passport 전략 초기화
 */
export function initPassportStrategies() {
  // 환경에 따른 콜백 URL 설정
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = isDevelopment 
    ? 'http://localhost:3350' 
    : 'https://api.ai645.com';
  
  const oauthRedirectUri = `${baseUrl}/api/auth`;
  
  // 환경변수 로드 확인
  console.log('🔧 OAuth 환경변수 확인:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  BASE_URL:', baseUrl);
  console.log('  KAKAO_CLIENT_ID:', process.env.KAKAO_CLIENT_ID || '❌ 미설정');
  console.log('  KAKAO_CLIENT_SECRET:', process.env.KAKAO_CLIENT_SECRET ? '✅ 설정됨' : '❌ 미설정');
  console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || '❌ 미설정');
  console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ 설정됨' : '❌ 미설정');
  console.log('  NAVER_CLIENT_ID:', process.env.NAVER_CLIENT_ID || '❌ 미설정');
  console.log('  NAVER_CLIENT_SECRET:', process.env.NAVER_CLIENT_SECRET ? '✅ 설정됨' : '❌ 미설정');
  console.log('  OAUTH_REDIRECT_URI:', oauthRedirectUri);
  console.log('  카카오 콜백 URL:', `${oauthRedirectUri}/kakao/callback`);
  console.log('  구글 콜백 URL:', `${oauthRedirectUri}/google/callback`);
  console.log('  네이버 콜백 URL:', `${oauthRedirectUri}/naver/callback`);

  // 카카오 전략
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_CLIENT_ID!,
        clientSecret: process.env.KAKAO_CLIENT_SECRET!,
        callbackURL: `${oauthRedirectUri}/kakao/callback`,
      },
      async (accessToken: string, refreshToken: string | undefined, profile: any, done: any) => {
        try {
          console.log('🔐 카카오 로그인 시도:', profile.id);
          
          const expiresAt = refreshToken 
            ? new Date(Date.now() + 6 * 60 * 60 * 1000) // 6시간
            : undefined;

          const { user, isNewUser } = await upsertSocialAccount(
            AuthProvider.KAKAO,
            profile.id.toString(),
            accessToken,
            refreshToken || '',
            expiresAt!,
            {
              nickname: profile.username || profile.displayName,
              email: profile._json?.kakao_account?.email,
            }
          );

          console.log(`✅ 카카오 로그인 ${isNewUser ? '신규 가입' : '기존 사용자'}:`, user.nickname);
          return done(null, user);
        } catch (error) {
          console.error('❌ 카카오 로그인 오류:', error);
          return done(error);
        }
      }
    )
  );

  // 구글 전략 (환경변수가 설정된 경우에만)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${oauthRedirectUri}/google/callback`,
        },
      async (accessToken: string, refreshToken: string | undefined, profile: any, done: any) => {
        try {
          console.log('🔐 구글 로그인 시도:', profile.id);
          
          const expiresAt = new Date(Date.now() + 3600 * 1000); // 1시간

          const { user, isNewUser } = await upsertSocialAccount(
            AuthProvider.GOOGLE,
            profile.id,
            accessToken,
            refreshToken || '',
            expiresAt,
            {
              nickname: profile.displayName,
              email: profile.emails?.[0]?.value,
            }
          );

          console.log(`✅ 구글 로그인 ${isNewUser ? '신규 가입' : '기존 사용자'}:`, user.nickname);
          return done(null, user);
        } catch (error) {
          console.error('❌ 구글 로그인 오류:', error);
          return done(error);
        }
      }
    )
  );
  } else {
    console.log('⚠️ Google OAuth 환경변수가 설정되지 않아 Google 로그인이 비활성화됩니다.');
  }

  // 네이버 전략
  passport.use(
    new NaverStrategy(
          {
      clientID: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
      callbackURL: `${oauthRedirectUri}/naver/callback`,
    },
      async (accessToken: string, refreshToken: string | undefined, profile: any, done: any) => {
        try {
          console.log('🔐 네이버 로그인 시도:', profile.id);
          
          const expiresAt = new Date(Date.now() + 3600 * 1000); // 1시간

          const { user, isNewUser } = await upsertSocialAccount(
            AuthProvider.NAVER,
            profile.id,
            accessToken,
            refreshToken || '',
            expiresAt,
            {
              nickname: profile.displayName,
              email: profile.emails?.[0]?.value,
            }
          );

          console.log(`✅ 네이버 로그인 ${isNewUser ? '신규 가입' : '기존 사용자'}:`, user.nickname);
          return done(null, user);
        } catch (error) {
          console.error('❌ 네이버 로그인 오류:', error);
          return done(error);
        }
      }
    )
  );

  // 세션 직렬화/역직렬화 (JWT 사용 시 불필요하지만 Passport 요구사항)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export { encryptToken, verifyToken }; 
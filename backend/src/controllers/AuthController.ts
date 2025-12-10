import { Request, Response } from 'express';
import passport from 'passport';
import * as crypto from 'crypto';
import { prisma } from '../config/database';
import { signAccessToken, signRefreshToken, extractJTI } from '../lib/jwt';
import { asyncHandler } from '../middlewares/errorHandler';

// 임시 해싱 함수 (결제 심사용)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'ai645_salt').digest('hex');
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

export class AuthController {
  /**
   * 임시 계정 생성 (결제 심사용)
   */
  public createTempAccount = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, password, nickname } = req.body;

      if (!email || !password || !nickname) {
        res.status(400).json({
          success: false,
          error: '필수 정보가 누락되었습니다.',
          message: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.',
        });
        return;
      }

      try {
        // 이메일 중복 확인
        const existingUser = await prisma?.user?.findUnique({
          where: { email },
        });

        if (existingUser) {
          res.status(409).json({
            success: false,
            error: '이미 존재하는 이메일입니다.',
            message: '다른 이메일을 사용해주세요.',
          });
          return;
        }

        // 비밀번호 해싱
        const hashedPassword = hashPassword(password);

        // 사용자 생성
        const user = await prisma?.user?.create({
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

        res.status(201).json({
          success: true,
          data: {
            id: user?.id,
            email: user?.email,
            nickname: user?.nickname,
          },
          message: '임시 계정이 생성되었습니다.',
        });
      } catch (error) {
        console.error('임시 계정 생성 오류:', error);
        res.status(500).json({
          success: false,
          error: '계정 생성에 실패했습니다.',
          message: '다시 시도해주세요.',
        });
      }
    }
  );

  /**
   * ID/비밀번호 로그인 (결제 심사용)
   */
  public loginWithPassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: '이메일과 비밀번호를 입력해주세요.',
          message: '필수 정보가 누락되었습니다.',
        });
        return;
      }

      try {
        // 사용자 조회
        const user = await prisma?.user?.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          res.status(401).json({
            success: false,
            error: '존재하지 않는 계정입니다.',
            message: '이메일 또는 비밀번호를 확인해주세요.',
          });
          return;
        }

        // 비밀번호 확인
        const isPasswordValid = verifyPassword(password, user.password);
        if (!isPasswordValid) {
          res.status(401).json({
            success: false,
            error: '비밀번호가 일치하지 않습니다.',
            message: '이메일 또는 비밀번호를 확인해주세요.',
          });
          return;
        }

        // JWT 토큰 발급
        const accessToken = await signAccessToken({
          sub: user.id,
          nickname: user.nickname,
        });

        const refreshToken = await signRefreshToken({
          sub: user.id,
          nickname: user.nickname,
        });
        const refreshTokenHash = hashPassword(refreshToken);

        // 리프레시 토큰 저장
        await prisma?.refreshToken?.create({
          data: {
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
          },
        });

        console.log('✅ ID/비밀번호 로그인 성공:', user.email);

        res.json({
          success: true,
          data: {
            accessToken,
            refreshToken,
            user: {
              id: user.id,
              email: user.email,
              nickname: user.nickname,
              role: user.role,
            },
          },
          message: '로그인에 성공했습니다.',
        });
      } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
          success: false,
          error: '로그인에 실패했습니다.',
          message: '다시 시도해주세요.',
        });
      }
    }
  );

  /**
   * 소셜 로그인 콜백 처리
   */
  public handleSocialCallback = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const provider = req.params.provider;
      if (!provider) {
        res.status(400).json({
          success: false,
          error: '프로바이더가 지정되지 않았습니다.',
          message: '올바른 로그인 URL을 사용해주세요.',
        });
        return;
      }

      passport.authenticate(provider, { session: false }, async (err: any, user: any) => {
        if (err) {
          console.error('소셜 로그인 오류:', err);
          res.status(500).json({
            success: false,
            error: '소셜 로그인에 실패했습니다.',
            message: '다시 시도해주세요.',
          });
          return;
        }

        if (!user) {
          res.status(401).json({
            success: false,
            error: '사용자 정보를 가져올 수 없습니다.',
            message: '다시 시도해주세요.',
          });
          return;
        }

        try {
          console.log('🔑 토큰 발급 시작 - 사용자 ID:', user.id, '닉네임:', user.nickname);
          
          // JWT 토큰 발급
          const accessToken = await signAccessToken({
            sub: user.id,
            nickname: user.nickname,
          });

          const refreshToken = await signRefreshToken({
            sub: user.id,
            nickname: user.nickname,
          });

          console.log('✅ 토큰 발급 완료 - 액세스 토큰 길이:', accessToken.length);

          // 리프레시 토큰 해시 저장
          const jti = extractJTI(refreshToken);
          if (jti) {
            console.log('🔐 리프레시 토큰 저장 시작 - JTI:', jti);
            const bcrypt = await import('bcryptjs');
            const tokenHash = await bcrypt.hash(jti, 10);
            
            if (prisma?.refreshToken) {
              await prisma.refreshToken.create({
                data: {
                  userId: user.id,
                  tokenHash,
                  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일
                },
              });
              console.log('✅ 리프레시 토큰 저장 완료');
            } else {
              console.error('❌ prisma.refreshToken이 undefined입니다!');
            }
          }

          // 쿠키 설정
          res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production' ? '.44tune.co.kr' : 'localhost', // 서브도메인 공유
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14일
          });

          // 프론트엔드로 리다이렉트 (토큰을 URL 파라미터로 전달)
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const redirectUrl = `${frontendUrl}/callback/auth/?success=true&user=${encodeURIComponent(user.nickname)}&access_token=${accessToken}`;
          
          res.redirect(redirectUrl);
        } catch (error) {
          console.error('JWT 토큰 발급 오류:', error);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const redirectUrl = `${frontendUrl}/callback/auth/?success=false&error=token_error`;
          res.redirect(redirectUrl);
        }
      })(req, res);
    }
  );

  /**
   * 로그아웃
   */
  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const jti = extractJTI(token);
          
          if (jti) {
            // 액세스 토큰을 블랙리스트에 추가
            await prisma?.accessTokenBlacklist?.create({
              data: {
                jti,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15분 후 만료
              },
            });
          }
        }

        // 리프레시 토큰 삭제
        const refreshToken = req.cookies?.refresh_token;
        if (refreshToken) {
          const jti = extractJTI(refreshToken);
          if (jti) {
            const bcrypt = await import('bcryptjs');
            const tokenHash = await bcrypt.hash(jti, 10);
            
            await prisma?.refreshToken?.deleteMany({
              where: { tokenHash },
            });
          }
        }

        // 쿠키 삭제
        res.clearCookie('refresh_token', {
          domain: process.env.NODE_ENV === 'production' ? '.44tune.co.kr' : undefined,
        });

        res.json({
          success: true,
          message: '로그아웃이 완료되었습니다.',
        });
      } catch (error) {
        console.error('로그아웃 오류:', error);
        res.status(500).json({
          success: false,
          error: '로그아웃 처리에 실패했습니다.',
          message: '다시 시도해주세요.',
        });
      }
    }
  );

  /**
   * 사용자 정보 조회
   */
  public getProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: '인증이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      const userData = await prisma?.user?.findUnique({
        where: { id: user.sub },
        include: {
          socialAccounts: {
            select: {
              provider: true,
              providerUid: true,
              createdAt: true,
            },
          },
        },
      });

      if (!userData) {
        res.status(404).json({
          success: false,
          error: '사용자를 찾을 수 없습니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      // 소셜 인증 타입 정보 추가
      const primarySocialAccount = userData.socialAccounts[0];
      const authType = primarySocialAccount ? primarySocialAccount.provider : null;

              res.json({
          success: true,
          data: {
            id: userData.id,
            nickname: userData.nickname,
            email: userData.email || null, // 이메일 정보 추가
            phone: userData.phone || null, // 연락처 정보 추가
            role: userData.role,
            termsAgreed: userData.termsAgreed,
            privacyAgreed: userData.privacyAgreed,
            marketingAgreed: userData.marketingAgreed,
            authType, // 주요 소셜 인증 타입 (KAKAO, GOOGLE, NAVER)
            socialAccounts: userData.socialAccounts.map((account: any) => ({
              provider: account.provider,
              providerUid: account.providerUid,
              connectedAt: account.createdAt,
            })),
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt || null,
          },
          message: '사용자 정보를 조회했습니다.',
        });
    }
  );

  /**
   * 사용자 정보 업데이트
   * PATCH /api/auth/profile
   * 값이 있는 필드만 업데이트 (부분 업데이트)
   */
  public updateProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: '인증이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      const { nickname, email, phone, termsAgreed, privacyAgreed, marketingAgreed } = req.body;

      // 업데이트할 데이터 객체 생성 (값이 있는 것만 포함)
      const updateData: any = {};
      
      if (nickname !== undefined && nickname !== null && nickname !== '') {
        updateData.nickname = nickname;
      }
      
      if (email !== undefined && email !== null && email !== '') {
        // 이메일 중복 체크 (다른 사용자가 사용 중인지 확인)
        const existingUser = await prisma?.user?.findFirst({
          where: {
            email,
            id: { not: user.sub },
          },
        });
        
        if (existingUser) {
          res.status(400).json({
            success: false,
            error: '이미 사용 중인 이메일입니다.',
            message: '다른 이메일을 사용해주세요.',
          });
          return;
        }
        
        updateData.email = email;
      }
      
      if (phone !== undefined && phone !== null && phone !== '') {
        updateData.phone = phone;
      }
      
      if (termsAgreed !== undefined && termsAgreed !== null) {
        updateData.termsAgreed = Boolean(termsAgreed);
      }
      
      if (privacyAgreed !== undefined && privacyAgreed !== null) {
        updateData.privacyAgreed = Boolean(privacyAgreed);
      }
      
      if (marketingAgreed !== undefined && marketingAgreed !== null) {
        updateData.marketingAgreed = Boolean(marketingAgreed);
      }

      // 업데이트할 데이터가 없으면 에러
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          error: '업데이트할 정보가 없습니다.',
          message: '변경할 정보를 입력해주세요.',
        });
        return;
      }

      // 사용자 정보 업데이트
      const updatedUser = await prisma?.user?.update({
        where: { id: user.sub },
        data: updateData,
        include: {
          socialAccounts: {
            select: {
              provider: true,
              providerUid: true,
              createdAt: true,
            },
          },
        },
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: '사용자를 찾을 수 없습니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      // 소셜 인증 타입 정보 추가
      const primarySocialAccount = updatedUser.socialAccounts[0];
      const authType = primarySocialAccount ? primarySocialAccount.provider : null;

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          nickname: updatedUser.nickname,
          email: updatedUser.email || null,
          phone: updatedUser.phone || null,
          role: updatedUser.role,
          termsAgreed: updatedUser.termsAgreed,
          privacyAgreed: updatedUser.privacyAgreed,
          marketingAgreed: updatedUser.marketingAgreed,
          authType,
          socialAccounts: updatedUser.socialAccounts.map((account: any) => ({
            provider: account.provider,
            providerUid: account.providerUid,
            connectedAt: account.createdAt,
          })),
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt || null,
        },
        message: '사용자 정보가 업데이트되었습니다.',
      });
    }
  );

  /**
   * 계정 탈퇴
   */
  public deleteAccount = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: '인증이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      try {
        // 소셜 계정 연결 해제 (실제로는 각 제공자의 API 호출 필요)
        // 여기서는 DB에서만 삭제
        
        // 사용자 삭제 (CASCADE로 관련 데이터 모두 삭제)
        await prisma?.user?.delete({
          where: { id: user.sub },
        });

        // 쿠키 삭제
        res.clearCookie('refresh_token', {
          domain: process.env.NODE_ENV === 'production' ? '.44tune.co.kr' : undefined,
        });

        res.json({
          success: true,
          message: '계정이 삭제되었습니다.',
        });
      } catch (error) {
        console.error('계정 삭제 오류:', error);
        res.status(500).json({
          success: false,
          error: '계정 삭제에 실패했습니다.',
          message: '다시 시도해주세요.',
        });
      }
    }
  );

  /**
   * 동의항목 업데이트
   */
  public updateConsent = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = (req as any).user?.sub;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: '로그인이 필요합니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      const { termsAgreed, privacyAgreed, marketingAgreed } = req.body;

      // 필수 동의항목 검증
      if (termsAgreed !== true || privacyAgreed !== true) {
        res.status(400).json({
          success: false,
          error: '필수 동의항목에 동의해야 합니다.',
          message: '이용약관과 개인정보 수집·이용에 동의해주세요.',
        });
        return;
      }

      try {
        const user = await prisma?.user?.update({
          where: { id: userId },
          data: {
            termsAgreed: termsAgreed || false,
            privacyAgreed: privacyAgreed || false,
            marketingAgreed: marketingAgreed || false,
          },
          select: {
            id: true,
            nickname: true,
            role: true,
            termsAgreed: true,
            privacyAgreed: true,
            marketingAgreed: true,
            createdAt: true,
          },
        });

        if (!user) {
          res.status(404).json({
            success: false,
            error: '사용자를 찾을 수 없습니다.',
            message: '다시 로그인해주세요.',
          });
          return;
        }

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              nickname: user.nickname,
              role: user.role,
              termsAgreed: user.termsAgreed,
              privacyAgreed: user.privacyAgreed,
              marketingAgreed: user.marketingAgreed,
              createdAt: user.createdAt,
            },
          },
          message: '동의항목이 업데이트되었습니다.',
        });
      } catch (error) {
        console.error('동의항목 업데이트 오류:', error);
        res.status(500).json({
          success: false,
          error: '동의항목 업데이트에 실패했습니다.',
          message: '잠시 후 다시 시도해주세요.',
        });
      }
    }
  );
} 
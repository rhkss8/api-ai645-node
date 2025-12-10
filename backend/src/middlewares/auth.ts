import {NextFunction, Request, Response} from 'express';
import {prisma} from '../config/database';
import {extractJTI, JWTPayloadWithUser, verifyJWT} from '../lib/jwt';

export interface AuthenticatedRequest extends Request {
  user?: any; // JWT 페이로드 또는 User 객체
}

/**
 * 액세스 토큰 검증 미들웨어
 */
export const authenticateAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: '액세스 토큰이 필요합니다.',
        message: 'Authorization 헤더에 Bearer 토큰을 포함해주세요.',
      });
      return;
    }

    const token = authHeader.substring(7);

    // JTI 추출
    const jti = extractJTI(token);
    if (!jti) {
      res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.',
        message: '토큰 형식이 올바르지 않습니다.',
      });
      return;
    }

    // 블랙리스트 확인
    const blacklisted = await prisma?.accessTokenBlacklist?.findUnique({
      where: { jti },
    });

    if (blacklisted) {
      res.status(401).json({
        success: false,
        error: '로그아웃된 토큰입니다.',
        message: '다시 로그인해주세요.',
      });
      return;
    }

    try {
      // JWT 검증
      const payload = await verifyJWT<JWTPayloadWithUser>(token);

      // 사용자 존재 확인
      const user = await prisma?.user?.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.deletedAt) {
        res.status(401).json({
          success: false,
          error: '존재하지 않는 사용자입니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      req.user = payload;
      next();
    } catch (jwtError: any) {
      // 토큰 만료 시 자동 갱신 시도
      if (jwtError.code === 'ERR_JWT_EXPIRED') {
        console.log('액세스 토큰 만료, 새 토큰 발급 시도');

        // 현재 액세스 토큰에서 사용자 정보 추출 (만료된 토큰이므로 검증 없이 디코딩)
        try {
          const { decodeJwt } = await import('jose');
          const payload = await decodeJwt(token) as JWTPayloadWithUser;

          // 사용자 존재 확인
          const user = await prisma?.user?.findUnique({
            where: { id: payload.sub },
          });

          if (!user || user.deletedAt) {
            res.status(401).json({
              success: false,
              error: '존재하지 않는 사용자입니다.',
              message: '다시 로그인해주세요.',
            });
            return;
          }

          // 새 토큰 발급
          const { signAccessToken, signRefreshToken } = await import('../lib/jwt');

          const newAccessToken = await signAccessToken({
            sub: user.id,
            nickname: user.nickname,
          });

          const newRefreshToken = await signRefreshToken({
            sub: user.id,
            nickname: user.nickname,
          });

          // 기존 리프레시 토큰들 삭제 (회전)
          await prisma?.refreshToken?.deleteMany({
            where: { userId: user.id },
          });

          // 새 리프레시 토큰 해시 저장
          const newJti = extractJTI(newRefreshToken);
          if (newJti) {
            const bcrypt = await import('bcryptjs');
            const newTokenHash = await bcrypt.hash(newJti, 10);
            await prisma?.refreshToken?.create({
              data: {
                userId: user.id,
                tokenHash: newTokenHash,
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일
              },
            });
          }

          // 새 쿠키 설정
          res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            domain: process.env.NODE_ENV === 'production' ? '.44tune.co.kr' : 'localhost',
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14일
          });

          // 새 액세스 토큰으로 사용자 정보 설정
          req.user = await verifyJWT<JWTPayloadWithUser>(newAccessToken);

          // 응답 헤더에 새 액세스 토큰 포함
          res.setHeader('X-New-Access-Token', newAccessToken);

          next();
          return;
        } catch (refreshError) {
          console.error('토큰 갱신 실패:', refreshError);
          // 토큰 갱신 실패 시 401 에러 반환
          res.status(401).json({
            success: false,
            error: '토큰 갱신에 실패했습니다.',
            message: '다시 로그인해주세요.',
            errorCode: 'TOKEN_REFRESH_FAILED',
          });
          return;
        }
      }

      // 기타 JWT 오류
      res.status(401).json({
        success: false,
        error: '토큰 검증에 실패했습니다.',
        message: '다시 로그인해주세요.',
        errorCode: 'TOKEN_VERIFICATION_FAILED',
      });
      return;
    }
  } catch (error) {
    console.error('액세스 토큰 검증 오류:', error);
    // 응답이 이미 전송되었는지 확인
    if (!res.headersSent) {
      res.status(401).json({
        success: false,
        error: '토큰 검증에 실패했습니다.',
        message: '다시 로그인해주세요.',
        errorCode: 'TOKEN_VERIFICATION_ERROR',
      });
    }
  }
};

/**
 * 선택적 액세스 토큰 검증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
 */
export const optionalAuthenticateAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 토큰이 없으면 그냥 통과
      next();
      return;
    }

    const token = authHeader.substring(7);

    // JTI 추출
    const jti = extractJTI(token);
    if (!jti) {
      // 토큰 형식이 잘못되었으면 그냥 통과
      next();
      return;
    }

    // 블랙리스트 확인
    const blacklisted = await prisma?.accessTokenBlacklist?.findUnique({
      where: { jti },
    });

    if (blacklisted) {
      // 블랙리스트된 토큰이면 그냥 통과
      next();
      return;
    }

    // JWT 검증
    const payload = await verifyJWT<JWTPayloadWithUser>(token);

    // 사용자 존재 확인
    const user = await prisma?.user?.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      // 사용자가 없으면 그냥 통과
      next();
      return;
    }

    // 모든 검증을 통과하면 사용자 정보 설정
    req.user = payload;
    next();
  } catch (error) {
    console.error('선택적 액세스 토큰 검증 오류:', error);
    // 에러가 발생해도 그냥 통과 (토큰이 없는 것으로 처리)
    next();
  }
};

/**
 * 리프레시 토큰 처리 미들웨어 (액세스 토큰으로 새 토큰 발급)
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Authorization 헤더에서 액세스 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        errorCode: 'MISSING_AUTHORIZATION_HEADER',
        error: '액세스 토큰이 필요합니다.',
        message: 'Authorization 헤더에 Bearer 토큰을 포함해주세요.',
      });
      return;
    }

    const accessToken = authHeader.substring(7);

    if (!accessToken) {
      res.status(401).json({
        success: false,
        errorCode: 'EMPTY_ACCESS_TOKEN',
        error: '액세스 토큰이 필요합니다.',
        message: '다시 로그인해주세요.',
      });
      return;
    }

    try {
      // 액세스 토큰에서 사용자 정보 추출 (만료된 토큰도 페이로드는 읽을 수 있음)
      const payload = await verifyJWT<JWTPayloadWithUser>(accessToken);

      // 사용자 존재 확인
      const user = await prisma?.user?.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.deletedAt) {
        res.status(401).json({
          success: false,
          error: '존재하지 않는 사용자입니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      // 새 토큰 발급
      const { signAccessToken, signRefreshToken } = await import('../lib/jwt');

      const newAccessToken = await signAccessToken({
        sub: user.id,
        nickname: user.nickname,
      });

      const newRefreshToken = await signRefreshToken({
        sub: user.id,
        nickname: user.nickname,
      });

      // 기존 리프레시 토큰들 삭제 (회전)
      await prisma?.refreshToken?.deleteMany({
        where: { userId: user.id },
      });

      // 새 리프레시 토큰 해시 저장
      const newJti = extractJTI(newRefreshToken);
      if (newJti) {
        const bcrypt = await import('bcryptjs');
        const newTokenHash = await bcrypt.hash(newJti, 10);
        await prisma?.refreshToken?.create({
          data: {
            userId: user.id,
            tokenHash: newTokenHash,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일
          },
        });
      }

      // 응답
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.44tune.co.kr' : 'localhost',
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14일
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          user: {
            id: user.id,
            nickname: user.nickname,
          },
          expiresIn: 15 * 60, // 15분
        },
        message: '토큰이 갱신되었습니다.',
      });
    } catch (jwtError: any) {
      // JWT 검증 실패 시
      console.error('JWT 검증 실패:', jwtError);

      let errorCode = 'TOKEN_INVALID';
      let errorMessage = '유효하지 않은 토큰입니다.';

      if (jwtError.code === 'ERR_JWT_EXPIRED') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = '토큰이 만료되었습니다.';
      } else if (jwtError.code === 'ERR_JWT_MALFORMED') {
        errorCode = 'TOKEN_MALFORMED';
        errorMessage = '토큰 형식이 올바르지 않습니다.';
      } else if (jwtError.code === 'ERR_JWT_SIGNATURE_VERIFICATION_FAILED') {
        errorCode = 'TOKEN_SIGNATURE_INVALID';
        errorMessage = '토큰 서명이 유효하지 않습니다.';
      }

      res.status(401).json({
        success: false,
        errorCode: errorCode,
        error: errorMessage,
        message: '다시 로그인해주세요.',
      });
    }
  } catch (error) {
    console.error('토큰 갱신 처리 오류:', error);
    res.status(401).json({
      success: false,
      errorCode: 'REFRESH_TOKEN_ERROR',
      error: '토큰 갱신에 실패했습니다.',
      message: '다시 로그인해주세요.',
    });
  }
};

/**
 * 관리자 권한 체크 미들웨어
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 먼저 인증 체크
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
        message: '로그인 후 다시 시도해주세요.',
      });
      return;
    }

    // 사용자 정보 조회
    const user = await prisma?.user?.findUnique({
      where: { id: req.user.sub },
    });

    if (!user || user.deletedAt) {
      res.status(401).json({
        success: false,
        error: '존재하지 않는 사용자입니다.',
        message: '다시 로그인해주세요.',
      });
      return;
    }

    // 관리자 권한 체크
    if (user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '관리자 권한이 필요합니다.',
        message: '이 기능은 관리자만 사용할 수 있습니다.',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('관리자 권한 체크 오류:', error);
    res.status(500).json({
      success: false,
      error: '권한 확인 중 오류가 발생했습니다.',
      message: '잠시 후 다시 시도해주세요.',
    });
  }
};

/**
 * 특정 역할 권한 체크 미들웨어
 */
export const requireRole = (requiredRole: 'USER' | 'ADMIN') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 먼저 인증 체크
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '인증이 필요합니다.',
          message: '로그인 후 다시 시도해주세요.',
        });
        return;
      }

      // 사용자 정보 조회
      const user = await prisma?.user?.findUnique({
        where: { id: req.user.sub },
      });

      if (!user || user.deletedAt) {
        res.status(401).json({
          success: false,
          error: '존재하지 않는 사용자입니다.',
          message: '다시 로그인해주세요.',
        });
        return;
      }

      // 역할 권한 체크
      if (user.role !== requiredRole) {
        res.status(403).json({
          success: false,
          error: '권한이 부족합니다.',
          message: `이 기능은 ${requiredRole} 역할이 필요합니다.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('역할 권한 체크 오류:', error);
      res.status(500).json({
        success: false,
        error: '권한 확인 중 오류가 발생했습니다.',
        message: '잠시 후 다시 시도해주세요.',
      });
    }
  };
};

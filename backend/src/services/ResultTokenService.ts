import jwt from 'jsonwebtoken';
import { FortuneCategory, FormType, SessionMode } from '../types/fortune';

export interface ResultTokenPayload {
  sessionId: string;
  userId: string;
  category: FortuneCategory;
  formType: FormType;
  mode: SessionMode;
}

/**
 * 결과 토큰 만료 시간 설정 (초 단위)
 * 기본값: 1일 (86400초)
 * 필요에 따라 이 값을 수정하세요.
 */
const RESULT_TOKEN_EXPIRES_IN_SECONDS = 86400; // 1일 = 24시간 * 60분 * 60초

export class ResultTokenService {
  constructor(private readonly secret: string) {}

  sign(payload: ResultTokenPayload, expiresInSeconds = RESULT_TOKEN_EXPIRES_IN_SECONDS): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresInSeconds });
  }

  verify(token: string): ResultTokenPayload {
    return jwt.verify(token, this.secret) as ResultTokenPayload;
  }
}



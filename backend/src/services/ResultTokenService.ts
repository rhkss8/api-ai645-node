import jwt from 'jsonwebtoken';
import { FortuneCategory, FormType, SessionMode } from '../types/fortune';

export interface ResultTokenPayload {
  sessionId: string;
  userId: string;
  category: FortuneCategory;
  formType: FormType;
  mode: SessionMode;
}

export class ResultTokenService {
  constructor(private readonly secret: string) {}

  sign(payload: ResultTokenPayload, expiresInSeconds = 1800): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresInSeconds });
  }

  verify(token: string): ResultTokenPayload {
    return jwt.verify(token, this.secret) as ResultTokenPayload;
  }
}



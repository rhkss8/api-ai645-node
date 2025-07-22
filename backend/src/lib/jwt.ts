import { readFileSync } from 'fs';
import { SignJWT, jwtVerify, JWTPayload, importPKCS8, importSPKI } from 'jose';
import { v4 as uuid } from 'uuid';

// 키를 KeyObject로 변환
const privateKeyBuffer = readFileSync(process.env.JWT_PRIVATE_KEY_PATH!);
const publicKeyBuffer = readFileSync(process.env.JWT_PUBLIC_KEY_PATH!);

let privateKey: any;
let publicKey: any;

// 키 초기화 함수
async function initializeKeys() {
  try {
    privateKey = await importPKCS8(privateKeyBuffer.toString(), 'RS256');
    publicKey = await importSPKI(publicKeyBuffer.toString(), 'RS256');
  } catch (error) {
    console.error('JWT 키 초기화 오류:', error);
    throw error;
  }
}

// 키 초기화 실행
initializeKeys();

export interface JWTPayloadWithUser extends JWTPayload {
  sub: string; // user ID
  nickname: string;
  provider?: string;
}

export async function signAccessToken(payload: JWTPayloadWithUser): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES || '15m')
    .setSubject(String(payload.sub))
    .setJti(uuid())
    .sign(privateKey);
}

export async function signRefreshToken(payload: JWTPayloadWithUser): Promise<string> {
  return new SignJWT({ typ: 'refresh', ...payload })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_REFRESH_EXPIRES || '14d')
    .setSubject(String(payload.sub))
    .setJti(uuid())
    .sign(privateKey);
}

export async function verifyJWT<T = JWTPayloadWithUser>(token: string): Promise<T> {
  const { payload } = await jwtVerify<T>(token, publicKey);
  return payload;
}

export function extractJTI(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    if (!payload) return null;
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded.jti || null;
  } catch {
    return null;
  }
} 
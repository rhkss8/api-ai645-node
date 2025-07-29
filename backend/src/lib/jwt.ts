import { readFileSync } from 'fs';
import { SignJWT, jwtVerify, JWTPayload, importPKCS8, importSPKI } from 'jose';
import { v4 as uuid } from 'uuid';

let privateKey: any;
let publicKey: any;

// 키 초기화 함수
async function initializeKeys() {
  try {
    // 환경변수에서 JWT 키를 가져오거나 파일에서 읽어오기
    let privateKeyString: string;
    let publicKeyString: string;

    // 환경변수에서 JWT 키 확인
    if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
      // 환경변수에서 키 사용 (클라우드타입 등)
      // 줄바꿈 문자를 올바르게 처리
      privateKeyString = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
      publicKeyString = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
      console.log('🔑 JWT 키를 환경변수에서 로드합니다.');
    } else if (process.env.JWT_PRIVATE_KEY_PATH && process.env.JWT_PUBLIC_KEY_PATH) {
      // 파일에서 키 읽기 (로컬 개발 환경)
      try {
        privateKeyString = readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');
        publicKeyString = readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');
        console.log('🔑 JWT 키를 파일에서 로드합니다.');
      } catch (error) {
        console.error('JWT 키 파일을 읽을 수 없습니다:', error);
        throw new Error('JWT 키 파일을 찾을 수 없습니다. 환경변수 JWT_PRIVATE_KEY와 JWT_PUBLIC_KEY를 설정하거나 키 파일을 생성해주세요.');
      }
    } else {
      throw new Error('JWT 키가 설정되지 않았습니다. 환경변수 JWT_PRIVATE_KEY와 JWT_PUBLIC_KEY를 설정하거나 키 파일 경로를 설정해주세요.');
    }

    // 키 형식 검증
    if (!privateKeyString.includes('-----BEGIN PRIVATE KEY-----') || 
        !publicKeyString.includes('-----BEGIN PUBLIC KEY-----')) {
      throw new Error('JWT 키 형식이 올바르지 않습니다. PEM 형식의 키를 사용해주세요.');
    }

    privateKey = await importPKCS8(privateKeyString, 'RS256');
    publicKey = await importSPKI(publicKeyString, 'RS256');
    console.log('✅ JWT 키 초기화 완료');
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
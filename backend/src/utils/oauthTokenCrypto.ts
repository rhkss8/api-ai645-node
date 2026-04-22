import * as crypto from 'crypto';

const VERSION_PREFIX = 'v1:';
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

/** 서버 설정 문제 — 사용자에게는 message만 노출 */
export class OauthEncryptionConfigError extends Error {
  readonly code: 'OAUTH_ENCRYPTION_UNCONFIGURED' | 'OAUTH_ENCRYPTION_INVALID';

  constructor(code: 'OAUTH_ENCRYPTION_UNCONFIGURED' | 'OAUTH_ENCRYPTION_INVALID') {
    super(
      '로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주시고, 계속되면 고객센터로 문의해 주세요.',
    );
    this.name = 'OauthEncryptionConfigError';
    this.code = code;
  }
}

/** 프로필 API 등 — 클라이언트가 배너/토스트에 쓸 안내 문구 */
export const SOCIAL_OAUTH_RELINK_USER_MESSAGE =
  '소셜 로그인을 다시 연결해 주세요. 서비스 보안 설정이 바뀌면 기존 연동이 끊길 수 있습니다.';

function getKey(): Buffer {
  const raw = process.env.OAUTH_TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new OauthEncryptionConfigError('OAUTH_ENCRYPTION_UNCONFIGURED');
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new OauthEncryptionConfigError('OAUTH_ENCRYPTION_INVALID');
  }
  return buf;
}

/**
 * 소셜 OAuth access/refresh 토큰 저장용 (복호화 가능).
 * 포맷: v1:<iv_b64>:<tag_b64>:<ct_b64>
 */
export function encryptOAuthToken(plain: string): string {
  if (!plain) {
    return plain;
  }
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptOAuthToken(stored: string): string | null {
  if (!stored) {
    return null;
  }
  if (stored.startsWith('$2')) {
    return null;
  }
  if (!stored.startsWith(VERSION_PREFIX)) {
    return null;
  }
  const key = getKey();
  try {
    const rest = stored.slice(VERSION_PREFIX.length);
    const parts = rest.split(':');
    if (parts.length !== 3) {
      return null;
    }
    const ivB64 = parts[0];
    const tagB64 = parts[1];
    const ctB64 = parts[2];
    if (!ivB64 || !tagB64 || !ctB64) {
      return null;
    }
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function tokenBlobNeedsRelink(blob: string | null): boolean {
  if (blob == null || blob === '') {
    return false;
  }
  if (blob.startsWith('$2')) {
    return true;
  }
  if (blob.startsWith(VERSION_PREFIX)) {
    return decryptOAuthToken(blob) === null;
  }
  return true;
}

/**
 * 키 교체·구버전 bcrypt 저장 등으로 복호화 불가일 때 true.
 * (getKey 실패 시 OauthEncryptionConfigError를 던짐 — 서버 설정 오류)
 */
export function socialOAuthTokensNeedRelink(
  refreshToken: string | null,
  accessToken: string | null,
): boolean {
  return tokenBlobNeedsRelink(refreshToken) || tokenBlobNeedsRelink(accessToken);
}

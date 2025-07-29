import DOMPurify from 'isomorphic-dompurify';

/**
 * XSS 공격 방지를 위한 HTML 정제
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * SQL Injection 방지를 위한 문자열 정제
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }
  
  // SQL Injection 패턴 제거
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/gi,
    /(['";\\])/g,
    /(\b(and|or)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(and|or)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/gi,
  ];
  
  let sanitized = str;
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
}

/**
 * 스크립트 공격 방지를 위한 텍스트 정제
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  // HTML 태그 제거
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // JavaScript 코드 제거
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // 위험한 문자 시퀀스 제거
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];
  
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
}

/**
 * 입력 길이 제한
 */
export function validateLength(value: string, maxLength: number, minLength: number = 1): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  const length = value.trim().length;
  return length >= minLength && length <= maxLength;
}

/**
 * 게시글 제목 검증
 */
export function validateTitle(title: string): boolean {
  if (!validateLength(title, 200, 1)) {
    return false;
  }
  
  const sanitized = sanitizeText(title);
  return sanitized.length > 0;
}

/**
 * 게시글 내용 검증
 */
export function validateContent(content: string): boolean {
  if (!validateLength(content, 10000, 1)) {
    return false;
  }
  
  const sanitized = sanitizeHtml(content);
  return sanitized.length > 0;
}

/**
 * 작성자 이름 검증
 */
export function validateAuthorName(authorName: string): boolean {
  if (!validateLength(authorName, 40, 1)) {
    return false;
  }
  
  const sanitized = sanitizeText(authorName);
  return sanitized.length > 0;
}

/**
 * Rate Limiting을 위한 키 생성
 */
export function generateRateLimitKey(userId: string, action: string): string {
  return `rate_limit:${action}:${userId}`;
}

/**
 * 입력값 정제 및 검증
 */
export function sanitizeAndValidateInput(input: any): {
  isValid: boolean;
  sanitized: any;
  errors: string[];
} {
  const errors: string[] = [];
  const sanitized: any = {};
  
  if (typeof input !== 'object' || input === null) {
    return { isValid: false, sanitized: {}, errors: ['유효하지 않은 입력입니다.'] };
  }
  
  // 제목 검증
  if (input.title !== undefined) {
    if (!validateTitle(input.title)) {
      errors.push('제목은 1-200자 사이여야 하며, 특수문자를 포함할 수 없습니다.');
    } else {
      sanitized.title = sanitizeText(input.title);
    }
  }
  
  // 내용 검증
  if (input.content !== undefined) {
    if (!validateContent(input.content)) {
      errors.push('내용은 1-10000자 사이여야 합니다.');
    } else {
      sanitized.content = sanitizeHtml(input.content);
    }
  }
  
  // 작성자 이름 검증 (제휴문의는 선택사항)
  if (input.authorName !== undefined) {
    if (input.authorName && !validateAuthorName(input.authorName)) {
      errors.push('작성자 이름은 1-40자 사이여야 하며, 특수문자를 포함할 수 없습니다.');
    } else if (input.authorName) {
      sanitized.authorName = sanitizeText(input.authorName);
    }
  }
  
  // 카테고리 검증
  if (input.category !== undefined) {
    const validCategories = ['NOTICE', 'SUGGESTION', 'PARTNERSHIP'];
    if (!validCategories.includes(input.category)) {
      errors.push('유효하지 않은 카테고리입니다.');
    } else {
      sanitized.category = input.category;
    }
  }
  
  // 중요공지 여부 검증
  if (input.isImportant !== undefined) {
    if (typeof input.isImportant !== 'boolean') {
      errors.push('중요공지 여부는 boolean 값이어야 합니다.');
    } else {
      sanitized.isImportant = input.isImportant;
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
} 
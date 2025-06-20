# Node.js 18 기반 이미지 사용 (LTS 버전)
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 (캐싱 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 애플리케이션 소스 코드 복사
COPY . .

# 비특권 사용자로 실행 (보안 강화)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 포트 노출
EXPOSE 4000

# 애플리케이션 실행
CMD ["npm", "run", "start"] 
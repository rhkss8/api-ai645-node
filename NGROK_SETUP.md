# ngrok 설정 가이드

PortOne 웹훅을 받기 위해 로컬 서버를 공개 URL로 노출하는 방법입니다.

## 방법 1: Docker Compose로 ngrok 실행 (권장)

### 1단계: ngrok 계정 생성 및 토큰 발급

1. [ngrok 공식 사이트](https://ngrok.com/) 접속
2. 회원가입 또는 로그인
3. Dashboard → **Your Authtoken** 메뉴로 이동
4. Authtoken 복사 (예: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`)

### 2단계: 환경변수 설정

`backend/.env` 파일에 ngrok 토큰 추가:

```env
NGROK_AUTHTOKEN=your_ngrok_authtoken_here
```

### 3단계: Docker Compose 설정

`docker-compose.yml`에 ngrok 서비스를 추가합니다:

```yaml
services:
  # ... 기존 서비스들 ...

  # ngrok (웹훅 테스트용)
  ngrok:
    image: ngrok/ngrok:latest
    container_name: api-ngrok
    command: start --all --config /etc/ngrok.yml
    environment:
      - NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
    volumes:
      - ./ngrok.yml:/etc/ngrok.yml:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network
```

### 4단계: ngrok 설정 파일 생성

프로젝트 루트에 `ngrok.yml` 파일 생성:

```yaml
version: "2"
authtoken: ${NGROK_AUTHTOKEN}
tunnels:
  api:
    proto: http
    addr: backend:3350
    inspect: false
```

### 5단계: Docker Compose 재시작

```bash
docker compose down
docker compose up -d
```

### 6단계: 공개 URL 확인

ngrok 로그에서 공개 URL 확인:

```bash
docker compose logs ngrok | grep "started tunnel"
```

또는 ngrok API로 확인:

```bash
curl http://localhost:4040/api/tunnels
```

출력 예시:
```json
{
  "tunnels": [
    {
      "name": "api",
      "uri": "/api/tunnels/api",
      "public_url": "https://abc123.ngrok-free.app",
      "proto": "https",
      "config": {
        "addr": "backend:3350",
        "inspect": false
      }
    }
  ]
}
```

### 7단계: PortOne 웹훅 URL 설정

PortOne 대시보드에서 웹훅 URL을 설정합니다:
```
https://abc123.ngrok-free.app/api/v1/fortune/payment/webhook
```

---

## 방법 2: 로컬에서 ngrok 실행 (Docker 없이)

### 1단계: ngrok 설치

**macOS:**
```bash
brew install ngrok/ngrok/ngrok
```

**Linux:**
```bash
# Ubuntu/Debian
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**Windows:**
[공식 다운로드 페이지](https://ngrok.com/download)에서 다운로드

### 2단계: ngrok 인증

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 3단계: ngrok 실행

```bash
ngrok http 3350
```

실행하면 다음과 같은 출력이 나타납니다:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3350

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Forwarding** 항목의 URL이 공개 URL입니다.

### 4단계: PortOne 웹훅 URL 설정

PortOne 대시보드에서 웹훅 URL을 설정합니다:
```
https://abc123.ngrok-free.app/api/v1/fortune/payment/webhook
```

---

## 방법 3: 고정 도메인 사용 (프로덕션용)

ngrok 유료 플랜을 사용하면 고정 도메인을 사용할 수 있습니다.

### 1단계: ngrok 유료 플랜 구독

[ngrok Pricing](https://ngrok.com/pricing)에서 플랜 선택

### 2단계: 고정 도메인 설정

ngrok Dashboard → **Domains** → **Add Domain**

### 3단계: ngrok.yml 설정

```yaml
version: "2"
authtoken: ${NGROK_AUTHTOKEN}
tunnels:
  api:
    proto: http
    addr: backend:3350
    domain: your-domain.ngrok-free.app
    inspect: false
```

---

## ngrok Web Interface

ngrok은 로컬에서 웹 인터페이스를 제공합니다:

- **URL**: http://localhost:4040
- **기능**:
  - 요청/응답 모니터링
  - 요청 재전송 (Replay)
  - 요청 검사 (Inspect)

### Docker 환경에서 접근

```bash
# ngrok 서비스에 포트 매핑 추가 (docker-compose.yml)
ports:
  - "4040:4040"  # ngrok Web Interface
```

---

## 트러블슈팅

### 1. ngrok이 연결되지 않는 경우

- Authtoken이 올바른지 확인
- 방화벽이 4040 포트를 차단하지 않는지 확인
- Docker 네트워크가 올바르게 설정되었는지 확인

### 2. 웹훅이 407 에러를 반환하는 경우

- 웹훅 URL이 올바른지 확인 (HTTPS 사용)
- `PORTONE_WEBHOOK_SECRET` 환경변수가 설정되었는지 확인
- 로그 확인: `docker compose logs backend --tail 50 | grep -A 10 '웹훅'`

### 3. ngrok 무료 플랜 제한

- **세션 시간**: 2시간 (자동 종료)
- **동시 연결**: 1개
- **도메인**: 랜덤 도메인 (재시작 시 변경됨)

### 4. ngrok Warning 페이지 해결

ngrok 무료 플랜은 첫 접속 시 Warning 페이지를 표시합니다.
이를 우회하려면:

1. **Request Header 추가** (PortOne 웹훅 설정에서):
   ```
   ngrok-skip-browser-warning: true
   ```

2. **또는 ngrok 유료 플랜 사용**

---

## 보안 고려사항

1. **ngrok Authtoken 보안**
   - `.env` 파일을 Git에 커밋하지 않도록 `.gitignore`에 추가
   - 프로덕션 환경에서는 환경변수로 관리

2. **웹훅 시크릿**
   - `PORTONE_WEBHOOK_SECRET`은 반드시 설정
   - 강력한 랜덤 문자열 사용

3. **Rate Limiting**
   - ngrok 무료 플랜은 요청 수 제한이 있을 수 있음
   - 백엔드의 Rate Limiter도 유지

---

## ngrok vs Cloudflare Tunnel 비교

| 기능 | ngrok | Cloudflare Tunnel |
|------|-------|-------------------|
| 설정 난이도 | ⭐ 쉬움 | ⭐⭐ 보통 |
| 무료 플랜 | ✅ 있음 (제한적) | ✅ 있음 |
| 고정 도메인 | 💰 유료 | ✅ 무료 |
| 세션 시간 | 2시간 (무료) | 무제한 |
| Web Interface | ✅ 제공 | ❌ 없음 |

---

## 참고 자료

- [ngrok 공식 문서](https://ngrok.com/docs)
- [ngrok Dashboard](https://dashboard.ngrok.com/)
- [PortOne 웹훅 가이드](https://developers.portone.io/docs/ko/webhook)


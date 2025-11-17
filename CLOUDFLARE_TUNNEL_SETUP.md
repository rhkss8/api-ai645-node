# Cloudflare Tunnel 설정 가이드

PortOne 웹훅을 받기 위해 로컬 서버를 공개 URL로 노출하는 방법입니다.

## 방법 1: Cloudflare Tunnel (권장)

### 1단계: Cloudflare 계정 준비

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인
2. Zero Trust 메뉴로 이동 (또는 [Zero Trust Dashboard](https://one.dash.cloudflare.com/) 직접 접속)

### 2단계: Tunnel 생성

1. Zero Trust Dashboard → **Networks** → **Tunnels** 이동
2. **Create a tunnel** 클릭
3. Tunnel 이름 입력 (예: `api-ai645-local`)
4. **Cloudflared** 선택
5. **Save tunnel** 클릭

### 3단계: Token 복사

Tunnel 생성 후 나타나는 **Token**을 복사합니다. (나중에 다시 볼 수 없으니 안전하게 보관)

### 4단계: Docker Compose에 Cloudflared 추가

`docker-compose.yml`에 cloudflared 서비스를 추가합니다:

```yaml
services:
  # ... 기존 서비스들 ...

  # Cloudflare Tunnel
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: api-cloudflared
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network
```

### 5단계: 환경변수 설정

`backend/.env` 파일에 Tunnel Token 추가:

```env
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token_here
```

### 6단계: Public Hostname 설정

1. Zero Trust Dashboard → **Networks** → **Tunnels** → 생성한 Tunnel 클릭
2. **Public Hostname** 탭 클릭
3. **Add a public hostname** 클릭
4. 설정:
   - **Subdomain**: `api-ai645` (원하는 서브도메인)
   - **Domain**: Cloudflare에 등록된 도메인 선택 (또는 `trycloudflare.com` 사용)
   - **Service**: `http://backend:3350` (Docker 내부 네트워크 주소)
   - **Path**: (비워둠)
5. **Save hostname** 클릭

### 7단계: Docker Compose 재시작

```bash
docker compose down
docker compose up -d
```

### 8단계: 공개 URL 확인

Cloudflare Dashboard에서 생성한 Public Hostname을 확인합니다.
예: `https://api-ai645.yourdomain.com` 또는 `https://api-ai645-xxxxx.trycloudflare.com`

### 9단계: PortOne 웹훅 URL 설정

PortOne 대시보드에서 웹훅 URL을 설정합니다:
```
https://api-ai645.yourdomain.com/api/v1/fortune/payment/webhook
```

---

## 방법 2: 로컬에서 Cloudflared 실행 (Docker 없이)

### 1단계: Cloudflared 설치

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
# Debian/Ubuntu
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
[공식 다운로드 페이지](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)에서 다운로드

### 2단계: Tunnel 로그인 및 생성

```bash
cloudflared tunnel login
cloudflared tunnel create api-ai645-local
```

### 3단계: Config 파일 생성

`~/.cloudflared/config.yml` 파일 생성:

```yaml
tunnel: <tunnel-id>
credentials-file: /Users/rhkss/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api-ai645.yourdomain.com
    service: http://localhost:3350
  - service: http_status:404
```

### 4단계: DNS 레코드 추가

```bash
cloudflared tunnel route dns api-ai645-local api-ai645.yourdomain.com
```

### 5단계: Tunnel 실행

```bash
cloudflared tunnel run api-ai645-local
```

---

## 방법 3: 임시 터널 (테스트용)

빠른 테스트를 위한 임시 터널:

```bash
cloudflared tunnel --url http://localhost:3350
```

이 명령어를 실행하면 임시 공개 URL이 생성됩니다:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable): |
|  https://xxxxx-xxxxx.trycloudflare.com                                                    |
+--------------------------------------------------------------------------------------------+
```

이 URL을 PortOne 웹훅에 설정하면 됩니다. (단, 재시작 시 URL이 변경됩니다)

---

## 트러블슈팅

### 1. Tunnel이 연결되지 않는 경우

- Token이 올바른지 확인
- 방화벽이 7844 포트를 차단하지 않는지 확인
- Docker 네트워크가 올바르게 설정되었는지 확인

### 2. 웹훅이 407 에러를 반환하는 경우

- 웹훅 URL이 올바른지 확인 (HTTPS 사용)
- `PORTONE_WEBHOOK_SECRET` 환경변수가 설정되었는지 확인
- 로그 확인: `docker compose logs backend --tail 50 | grep -A 10 '웹훅'`

### 3. 로컬 서버에 접근이 안 되는 경우

- `docker compose ps`로 서비스가 실행 중인지 확인
- `docker compose logs backend`로 백엔드 로그 확인
- Public Hostname의 Service URL이 올바른지 확인 (`http://backend:3350`)

---

## 보안 고려사항

1. **Tunnel Token 보안**
   - `.env` 파일을 Git에 커밋하지 않도록 `.gitignore`에 추가
   - 프로덕션 환경에서는 환경변수로 관리

2. **웹훅 시크릿**
   - `PORTONE_WEBHOOK_SECRET`은 반드시 설정
   - 강력한 랜덤 문자열 사용

3. **Rate Limiting**
   - Cloudflare의 Rate Limiting 기능 활용
   - 백엔드의 Rate Limiter도 유지

---

## 참고 자료

- [Cloudflare Tunnel 공식 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [PortOne 웹훅 가이드](https://developers.portone.io/docs/ko/webhook)


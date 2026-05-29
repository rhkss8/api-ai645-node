# 포포춘 백엔드 실행 가이드

## 1. 목적
이 문서는 포포춘 백엔드를 로컬에서 실행하고 확인할 때 가장 자주 쓰는 흐름만 빠르게 정리한다.

대상:
- Docker 실행
- 로그 확인
- DB 웹 로컬 서버 실행
- 한 번에 실행하는 스크립트 사용

## 2. 기준 경로

- 프로젝트 루트: `/Users/rhkss/Desktop/projects/api-ai645-node`
- 백엔드: `/Users/rhkss/Desktop/projects/api-ai645-node/backend`
- 스크립트: `/Users/rhkss/Desktop/projects/api-ai645-node/scripts/forfortune-backend.sh`

## 3. 사전 조건

- Docker Desktop 실행 중
- `backend/.env` 준비
- Node.js / npm 사용 가능

## 4. 가장 자주 쓰는 명령

### 4.1 도커 실행

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node
docker compose up -d
```

설명:
- backend, db 컨테이너를 백그라운드로 올린다.

### 4.2 백엔드 로그 보기

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node
docker compose logs -f backend
```

### 4.3 DB 로그 보기

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node
docker compose logs -f db
```

### 4.4 DB 웹 로컬 서버 실행

포포춘 기준으로는 Prisma Studio를 사용한다.

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node/backend
npx prisma studio --port 5557
```

접속:
- [http://localhost:5557](http://localhost:5557)

참고:
- `docker-compose.yml`의 backend 컨테이너에는 `5556` 포트 매핑이 있지만, 현재 가이드는 충돌을 피하려고 로컬 Studio 기본 포트를 `5557`로 사용한다.

## 5. 추천 방식: 스크립트 사용

스크립트:
- [forfortune-backend.sh](/Users/rhkss/Desktop/projects/api-ai645-node/scripts/forfortune-backend.sh)

### 5.1 도커 실행

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node
./scripts/forfortune-backend.sh up
```

### 5.2 백엔드 로그

```bash
./scripts/forfortune-backend.sh logs
```

### 5.3 DB 로그

```bash
./scripts/forfortune-backend.sh logs-db
```

### 5.4 Prisma Studio 실행

```bash
./scripts/forfortune-backend.sh studio
```

접속:
- [http://localhost:5557](http://localhost:5557)

### 5.5 한 번에 실행

```bash
./scripts/forfortune-backend.sh all
```

동작:
1. `docker compose up -d`
2. Prisma Studio를 백그라운드로 실행
3. 현재 터미널에서는 backend 로그를 계속 따라감

즉:
- API/DB는 도커로 올라오고
- Prisma Studio는 별도 백그라운드 프로세스로 뜨고
- 현재 터미널은 로그 모니터링 용도로 사용된다

### 5.6 상태 확인

```bash
./scripts/forfortune-backend.sh ps
```

### 5.7 backend 재시작

```bash
./scripts/forfortune-backend.sh restart
```

### 5.8 db 재시작

```bash
./scripts/forfortune-backend.sh restart-db
```

### 5.9 전체 종료

```bash
./scripts/forfortune-backend.sh down
```

### 5.10 Prisma Studio 종료

```bash
./scripts/forfortune-backend.sh studio-stop
```

## 6. 자주 확인할 접속 정보

- Backend API: [http://localhost:3350](http://localhost:3350)
- Swagger: [http://localhost:3350/api-docs](http://localhost:3350/api-docs)
- Health: [http://localhost:3350/health](http://localhost:3350/health)
- PostgreSQL: `localhost:3236`
- Prisma Studio: [http://localhost:5557](http://localhost:5557)

## 7. 추천 실사용 흐름

### 가장 추천

```bash
cd /Users/rhkss/Desktop/projects/api-ai645-node
./scripts/forfortune-backend.sh all
```

이 경우:
- 도커 컨테이너가 뜬다
- Prisma Studio가 뜬다
- 터미널에서 backend 로그를 바로 본다

### 로그는 지금 필요 없고 실행만 할 때

```bash
./scripts/forfortune-backend.sh up
./scripts/forfortune-backend.sh studio
```

## 8. 문제 생길 때

### 포트 충돌
- `3350`, `3236`, `5557` 사용 중인지 확인

### Prisma Studio가 이미 떠 있을 때
- `./scripts/forfortune-backend.sh studio-stop`
- 다시 `./scripts/forfortune-backend.sh studio`

### backend만 다시 올리고 싶을 때

```bash
./scripts/forfortune-backend.sh restart
```

### 전체 다시 올리고 싶을 때

```bash
./scripts/forfortune-backend.sh down
./scripts/forfortune-backend.sh all
```

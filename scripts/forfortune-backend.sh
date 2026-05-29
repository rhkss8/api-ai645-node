#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
STUDIO_PORT="${STUDIO_PORT:-5557}"
STUDIO_PID_FILE="${TMPDIR:-/tmp}/forfortune-prisma-studio.pid"

log() {
  printf '[forfortune-backend] %s\n' "$1"
}

ensure_root() {
  cd "$ROOT_DIR"
}

ensure_env() {
  if [ ! -f "$BACKEND_DIR/.env" ]; then
    log "backend/.env 파일이 없습니다. 먼저 환경변수를 준비해주세요."
    exit 1
  fi
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    log "docker 명령을 찾을 수 없습니다."
    exit 1
  fi
}

ensure_npm() {
  if ! command -v npm >/dev/null 2>&1; then
    log "npm 명령을 찾을 수 없습니다."
    exit 1
  fi
}

compose_up() {
  ensure_root
  ensure_env
  ensure_docker
  log "docker compose up -d 실행"
  docker compose up -d
}

compose_logs() {
  ensure_root
  ensure_docker
  local service="${1:-backend}"
  log "docker compose logs -f ${service} 실행"
  docker compose logs -f "$service"
}

compose_ps() {
  ensure_root
  ensure_docker
  docker compose ps
}

compose_restart() {
  ensure_root
  ensure_docker
  local service="${1:-backend}"
  log "docker compose restart ${service} 실행"
  docker compose restart "$service"
}

compose_down() {
  ensure_root
  ensure_docker
  log "docker compose down 실행"
  docker compose down
}

start_studio() {
  ensure_root
  ensure_env
  ensure_npm

  if [ -f "$STUDIO_PID_FILE" ]; then
    local existing_pid
    existing_pid="$(cat "$STUDIO_PID_FILE")"
    if ps -p "$existing_pid" >/dev/null 2>&1; then
      log "Prisma Studio가 이미 실행 중입니다. http://localhost:${STUDIO_PORT}"
      return 0
    fi
    rm -f "$STUDIO_PID_FILE"
  fi

  log "Prisma Studio를 백그라운드로 실행합니다. http://localhost:${STUDIO_PORT}"
  (
    cd "$BACKEND_DIR"
    nohup npx prisma studio --port "$STUDIO_PORT" >/tmp/forfortune-prisma-studio.log 2>&1 &
    echo $! > "$STUDIO_PID_FILE"
  )
}

stop_studio() {
  if [ ! -f "$STUDIO_PID_FILE" ]; then
    log "Prisma Studio pid 파일이 없습니다."
    return 0
  fi

  local pid
  pid="$(cat "$STUDIO_PID_FILE")"
  if ps -p "$pid" >/dev/null 2>&1; then
    kill "$pid"
    log "Prisma Studio(pid=$pid) 종료"
  else
    log "Prisma Studio 프로세스가 이미 종료된 상태입니다."
  fi
  rm -f "$STUDIO_PID_FILE"
}

show_help() {
  cat <<EOF
포포춘 백엔드 실행 스크립트

사용법:
  ./scripts/forfortune-backend.sh <command>

명령:
  up             docker compose up -d
  logs           backend 로그 확인
  logs-db        db 로그 확인
  ps             컨테이너 상태 확인
  restart        backend 재시작
  restart-db     db 재시작
  down           docker compose down
  studio         Prisma Studio 실행 (http://localhost:${STUDIO_PORT})
  studio-stop    Prisma Studio 종료
  all            도커 실행 + Prisma Studio 실행 + backend 로그 따라가기
  help           도움말
EOF
}

main() {
  local command="${1:-help}"

  case "$command" in
    up)
      compose_up
      ;;
    logs)
      compose_logs backend
      ;;
    logs-db)
      compose_logs db
      ;;
    ps)
      compose_ps
      ;;
    restart)
      compose_restart backend
      ;;
    restart-db)
      compose_restart db
      ;;
    down)
      compose_down
      ;;
    studio)
      start_studio
      ;;
    studio-stop)
      stop_studio
      ;;
    all)
      compose_up
      start_studio
      log "이제 backend 로그를 따라갑니다. Prisma Studio는 백그라운드에서 유지됩니다."
      compose_logs backend
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      log "알 수 없는 명령: $command"
      show_help
      exit 1
      ;;
  esac
}

main "$@"

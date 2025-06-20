#!/bin/bash

# 개발 환경 관리 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 도움말 표시
show_help() {
    echo "개발 환경 관리 스크립트"
    echo
    echo "사용법: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  start       개발 환경 시작"
    echo "  stop        개발 환경 중지"
    echo "  restart     개발 환경 재시작"
    echo "  logs        로그 확인"
    echo "  clean       모든 컨테이너 및 볼륨 제거"
    echo "  db-connect  데이터베이스에 연결"
    echo "  db-backup   데이터베이스 백업"
    echo "  health      서비스 상태 확인"
    echo "  setup       초기 설정"
    echo "  help        이 도움말 표시"
}

# 초기 설정
setup() {
    log_info "초기 설정을 시작합니다..."
    
    # 환경변수 파일 확인 및 생성
    if [ ! -f "backend/.env" ]; then
        log_info "backend/.env 파일을 생성합니다..."
        cp backend/env.example backend/.env
        log_success "backend/.env 파일이 생성되었습니다."
        log_warning "backend/.env 파일을 확인하고 필요한 값들을 수정해주세요."
    else
        log_info "backend/.env 파일이 이미 존재합니다."
    fi
    
    # Docker 이미지 빌드
    log_info "Docker 이미지를 빌드합니다..."
    docker compose build
    
    log_success "초기 설정이 완료되었습니다!"
}

# 개발 환경 시작
start() {
    log_info "개발 환경을 시작합니다..."
    docker compose up -d
    
    # 서비스 시작 대기
    log_info "서비스 시작을 기다리는 중..."
    sleep 10
    
    # 상태 확인
    health
}

# 개발 환경 중지
stop() {
    log_info "개발 환경을 중지합니다..."
    docker compose down
    log_success "개발 환경이 중지되었습니다."
}

# 개발 환경 재시작
restart() {
    log_info "개발 환경을 재시작합니다..."
    stop
    start
}

# 로그 확인
logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        log_info "$service 서비스의 로그를 확인합니다..."
        docker compose logs -f "$service"
    else
        log_info "전체 서비스의 로그를 확인합니다..."
        docker compose logs -f
    fi
}

# 정리
clean() {
    log_warning "모든 컨테이너와 볼륨을 제거합니다. 계속하시겠습니까? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "정리를 시작합니다..."
        docker compose down -v --remove-orphans
        docker system prune -f
        log_success "정리가 완료되었습니다."
    else
        log_info "취소되었습니다."
    fi
}

# 데이터베이스 연결
db_connect() {
    log_info "데이터베이스에 연결합니다..."
    docker compose exec db psql -U postgres -d main
}

# 데이터베이스 백업
db_backup() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "데이터베이스를 백업합니다: $backup_file"
    docker compose exec -T db pg_dump -U postgres main > "$backup_file"
    log_success "백업이 완료되었습니다: $backup_file"
}

# 서비스 상태 확인
health() {
    log_info "서비스 상태를 확인합니다..."
    
    # 컨테이너 상태 확인
    docker compose ps
    
    echo
    log_info "Backend 서비스 확인 중..."
    if curl -f -s http://localhost:3350/health > /dev/null 2>&1; then
        log_success "Backend 서비스가 정상적으로 실행 중입니다."
    else
        log_warning "Backend 서비스에 연결할 수 없습니다."
    fi
    
    log_info "Database 서비스 확인 중..."
    if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        log_success "Database 서비스가 정상적으로 실행 중입니다."
    else
        log_warning "Database 서비스에 연결할 수 없습니다."
    fi
}

# 메인 로직
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    clean)
        clean
        ;;
    db-connect)
        db_connect
        ;;
    db-backup)
        db_backup
        ;;
    health)
        health
        ;;
    setup)
        setup
        ;;
    help|*)
        show_help
        ;;
esac 
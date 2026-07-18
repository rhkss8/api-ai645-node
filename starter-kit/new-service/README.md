# TARS 신규 서비스 스타터킷

TARS는 새 서비스를 만들 때마다 같은 방식으로 시작하기 위한 로컬 CLI 스타터킷입니다.

서비스 정의와 페르소나만 입력하면, Codex가 같은 품질 기준으로 기획 정리부터 MVP 개발까지 이어갈 수 있도록 프로젝트 하네스를 준비합니다.

## TARS가 해주는 것

TARS는 앱을 직접 만들어주는 도구라기보다, Codex가 일관되게 일할 수 있도록 프로젝트의 작업 기준을 잡아주는 런처입니다.

TARS가 준비하는 것:

- 서비스 정의
- 페르소나
- 핵심 pain
- before/after 변화
- G-Stack
- Superpowers
- MVP todo
- 디자인 제작 파이프라인
- 디자인 레퍼런스 보드
- 시각 방향 2-3안
- 방향 선택 기록
- 디자인 철학
- 인터랙션 원칙
- 디자인 시스템 기준
- 디자인 톤앤매너
- 서비스 디자인 블루프린트
- 디자인 리뷰 루브릭
- 디자인 QA 체크리스트
- 시니어 프론트엔드 개발 기준
- AI 계약
- analytics 이벤트
- QA 체크리스트
- 의사결정 게이트
- 깊은 사고 워크플로우
- lesson-and-run 기록
- inbox 원본 자료와 wiki 지식망
- 집/회사 PC handoff 규칙

## 가장 먼저 할 일

새 프로젝트 루트에 아래 파일과 폴더를 복사합니다.

```txt
docs/
tars
start
activate
scripts/install-tars.zsh
```

그다음 실행 권한을 줍니다.

```bash
chmod +x tars start scripts/install-tars.zsh
```

`tars`를 어디서든 명령어로 쓰고 싶으면 설치합니다.

```bash
zsh scripts/install-tars.zsh
source ~/.zshrc
```

설치가 잘 됐는지 확인합니다.

```bash
tars
```

설치하지 않고 프로젝트 안에서만 쓰려면 이렇게 실행해도 됩니다.

```bash
./tars
./tars init
```

## 처음 프로젝트를 시작할 때

새 서비스 MVP를 시작할 때는 먼저 아래 명령을 실행합니다.

```bash
tars init
```

TARS가 아래 질문을 순서대로 물어봅니다.

- 서비스 정의
- 페르소나
- 핵심 pain
- Before 상태
- After 상태
- 핵심 메커니즘

입력이 끝나면 `docs/service-definition.md`와 `docs/start-session.md`가 생성되거나 갱신됩니다.

그다음 아래 명령을 실행합니다.

```bash
tars start
```

출력되는 프롬프트를 Codex에게 전달하거나, Codex에게 이렇게 말하면 됩니다.

```txt
tars 기준으로 시작해줘.
```

Codex는 `docs/agent-runbook.md`를 기준으로 기획 정리, G-Stack, Superpowers, MVP todo, 디자인 레퍼런스, 시각 방향 2-3안, 방향 선택, 와이어프레임 계획, 디자인 시스템, 서비스 디자인, 디자인 리뷰/QA, 개발 하네스, AI/QA/analytics 기준을 잡고 다음 작업으로 넘어갑니다.

## 평소 작업할 때

작업 전에는 현재 상태를 확인합니다.

```bash
tars status
tars next
```

원본 리서치, 인터뷰, 기획 메모, 디자인 레퍼런스가 있으면 `docs/inbox/`에 넣고 wiki 정리를 요청할 수 있습니다.

```bash
tars wiki
```

`docs/wiki/`는 Codex가 `docs/inbox/` 원본을 읽고 만든 `[[링크]]` 기반 지식망입니다. 모든 작업에서 읽는 문서가 아니라, 제품 의도나 리서치 근거가 필요할 때만 참조합니다.

기획, 설계, UX 방향, 큰 구현, 모호한 todo처럼 딴길로 새기 쉬운 작업은 먼저 생각 모드를 실행합니다.

```bash
tars think
```

`tars think`는 바로 코딩하지 않고 문제 재정의, 꼬리 질문, 마인드맵, 선택지 비교, 제외할 범위, 실행 계획을 만들도록 Codex를 세팅합니다.

그리고 Codex에게 말합니다.

```txt
tars 기준으로 다음 todo 진행해줘.
```

권장 작업 루프:

```txt
1. tars next로 다음 todo 확인
2. Codex에게 다음 todo 진행 요청
3. Codex가 필요한 문서를 읽고 구현
4. Codex가 테스트/검증 실행
5. 중요한 결정은 docs/decision-log.md에 기록
6. 반복해서 배운 점은 docs/lessons-and-rules.md에 기록
7. tars done으로 완료 체크
8. git commit
9. 다음 todo로 진행
```

작업 하나가 끝나면:

```bash
tars done
git add .
git commit -m "fix: 변경 내용 한글 요약"
tars next
```

## 회사 PC에서 작업을 마칠 때

집 PC에서 이어서 작업하려면, 회사 PC에서 작업 상태를 반드시 넘겨야 합니다.

먼저 handoff 상태를 확인합니다.

```bash
tars handoff
```

그다음 변경사항을 커밋하고 푸시합니다.

```bash
git status
git add .
git commit -m "fix: 변경 내용 한글 요약"
git push
```

중요한 점:

- `docs/decision-log.md`에 결정 사항을 남깁니다.
- `docs/lessons-and-rules.md`에 반복 적용할 교훈을 남깁니다.
- `docs/mvp-todo.md`의 완료 체크를 최신으로 맞춥니다.
- `.env` 같은 실제 비밀값은 커밋하지 않습니다.
- 대신 `.env.example`은 커밋해도 됩니다.

## 집 PC에서 이어서 작업할 때

집 PC에서는 먼저 최신 코드를 받습니다.

```bash
git pull
```

그다음 TARS 상태를 확인합니다.

```bash
tars doctor
tars status
tars next
```

그리고 Codex에게 말합니다.

```txt
tars 기준으로 다음 todo 진행해줘.
```

이렇게 하면 회사 PC에서 하던 작업을 집 PC에서도 같은 기준으로 이어갈 수 있습니다.

## 집 PC에 처음 세팅할 때

처음 쓰는 PC라면 저장소를 클론한 뒤 TARS를 설치합니다.

```bash
git clone [repo-url]
cd [project-folder]
chmod +x tars start scripts/install-tars.zsh
zsh scripts/install-tars.zsh
source ~/.zshrc
tars doctor
```

그다음 프로젝트별 환경변수를 준비합니다.

```bash
cp .env.example .env
```

`.env` 안의 실제 키는 각 PC에서 직접 채웁니다.

## CLI와 Codex를 어떻게 같이 쓰나

둘 다 씁니다. 역할이 다릅니다.

TARS CLI:

- 현재 프로젝트가 준비됐는지 확인
- 시작 프롬프트 생성
- 다음 todo 확인
- PC 간 handoff 체크
- 재진입 프로토콜과 starter acceptance 확인

Codex:

- 기획 브레인스토밍
- 의사결정 정리
- 실제 코드 구현
- 테스트 실행
- 문서 업데이트
- 다음 작업 진행

쉽게 말하면:

```txt
TARS = 방향표지판
Codex = 실제 작업자
Git = 집/회사 PC 사이의 원장
```

## 자주 쓰는 명령어

```bash
tars              웰컴 메시지와 명령어 가이드 출력
tars init         서비스 정의 질문 시작
tars init --force 서비스 정의 다시 입력
tars start        Codex 시작 프롬프트 출력
tars prompt       시작 프롬프트만 출력
tars think        기획/설계/큰 구현 전 깊은 사고 프롬프트 출력
tars maintain     빠른 유지보수/수정 작업 프롬프트 출력
tars maintain --hard 운영/릴리즈급 유지보수 프롬프트 출력
tars status       스타터 문서 준비 상태 확인
tars next         다음 MVP todo 확인
tars doctor       필수 파일 검증
tars wiki         inbox 원본을 wiki 지식망으로 정리
tars acceptance   starter acceptance 불변식 검사
tars done         작업 완료 체크와 커밋 가이드 출력
tars handoff      집/회사 PC 전환 체크리스트 출력
```

## 문제가 생겼을 때

`tars: command not found`가 나오면 PATH 설정이 안 된 것입니다.

해결:

```bash
zsh scripts/install-tars.zsh
source ~/.zshrc
tars
```

그래도 안 되면 프로젝트 안에서 직접 실행합니다.

```bash
./tars
```

`tars doctor`에서 missing이 나오면 스타터 파일이 덜 복사된 것입니다. `docs/`, `tars`, `scripts/install-tars.zsh`가 있는지 확인합니다.

집/회사 PC 작업이 꼬였을 때는 새 작업을 시작하지 말고 먼저 확인합니다.

```bash
git status
git pull
tars handoff
```

## 더 자세한 구조

운영 모델과 폴더 구조는 [HOW_IT_WORKS.md](HOW_IT_WORKS.md)를 확인하세요.

# 사주라 프로젝트 — Codex 작업 지침

## 세션 시작 시 반드시 읽는다

1. `PROGRESS.md` — 현재 프로젝트 단계·진행 상황·정책 결정 이력 파악
2. `HANDOFF.md` — 다음 작업 목록·컨텍스트·진입점 파악
3. `docs/README.md` — 문서 폴더 구조, 파일별 역할, 작성 규칙 파악

---

## 핵심 4규칙

1. **사실은 한 곳에만 정의** — `docs/README.md` 섹션 2-1 SSOT 테이블에서 정의 위치 확인 후 재기술 금지
2. **한 파일 수정 시 연동 파일 즉시 함께 수정** — "나중에" 없음
3. **세션 종료 전** `PROGRESS.md` 섹션 4 문서 수정 이력 업데이트
4. **main 전용 문서(PROGRESS·docs/spec·docs/plan·루트 README·CLAUDE·AGENTS) 작업 시작 전 반드시 최신 main 동기화** — 작업 직전에 `git checkout main && git fetch origin && git pull --ff-only origin main`을 수행하고, admin이 아니면 그 위에서 `docs/<주제>` 브랜치를 따 PR로 머지한다. 옛 main 상태에서 곧장 수정 금지. 상세 절차는 `README.md` §5 "문서 작업 시작 전 필수 절차"

---

## 작업 방식

- AI가 먼저 항목을 제안하고 담당자가 확정
- 확정된 내용은 즉시 문서에 반영
- 제안 시 **추가/제외 추천 항목을 항상 함께 제시**
- 08_ai 작업 시 → `docs/spec/prompts/08_ai_handoff.md` 먼저 읽고 시작
- 새 정책·방향 결정 발생 시 → `PROGRESS.md` 섹션 3에 기록

---

## 파일별 역할 한 줄 요약

→ `docs/README.md` 섹션 1 참고

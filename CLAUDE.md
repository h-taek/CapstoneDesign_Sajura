# 사주라 프로젝트 — Claude 작업 지침

## 문서 작업 규칙

**설계 문서를 작성하거나 수정하기 전에 반드시 읽는다:**
→ `docs/prompts/writing_rules.md`

핵심 3규칙:
1. **사실은 한 곳에만 정의** — SSOT 테이블에서 정의 위치를 확인하고 재기술 금지
2. **한 파일 수정 시 연동 파일 즉시 함께 수정** — "나중에" 없음
3. **세션 종료 전** `docs/prompts/consistency_check.md` 검증 기록 업데이트

---

## 파일별 역할 한 줄 요약

| 파일 | 역할 | 정의하는 사실 |
|------|------|--------------|
| `feature_spec.md` | 비즈니스 규칙 원본 | 신뢰도 기준, FIFO 로직, 알림 정책 등 |
| `api_spec.md` | API 계약 원본 | 요청/응답 구조, 상태코드, AI Server API |
| `schema.md` | DB 구조 원본 | 컬럼명, 타입, FK, 인덱스 |
| `erd.md` | schema.md 시각화 | schema와 항상 동기화 필요 |
| `service_design.md` | 구현 설계 | schema·api_spec 결정을 반영 |
| `docs/prompts/06_ai_handoff.md` | 06_ai 작업 인수인계 | 01~05 확정 내용 요약 |
| `docs/prompts/consistency_check.md` | 일관성 검증 체크리스트 | 교차 검증 항목 + 수정 기록 |

---

## 작업 방식

- AI가 먼저 항목을 제안하고 담당자가 확정
- 확정된 내용은 즉시 문서에 반영
- 제안 시 **추가/제외 추천 항목을 항상 함께 제시**
- 06_ai 작업 시 → `docs/prompts/06_ai_handoff.md` 먼저 읽고 시작

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
| `requirements.md` | 요구사항 원본 | 프로젝트 목표·고객·기능·비기능 요구사항 |
| `usecase_spec.md` | 유즈케이스 원본 | 액터 관계, UC별 목적·흐름·조건 |
| `feature_list.md` | 기능 목록 원본 | 기능 분류, 베이스라인 모델 순서, 추천발주 단계 정책 |
| `feature_spec.md` | 비즈니스 규칙 원본 | 신뢰도 기준, FIFO 로직, 인증 정책, 알림 정책 |
| `api_spec.md` | API 계약 원본 | 요청/응답 구조, 상태코드, AI Server API |
| `schema.md` | DB 구조 원본 | 컬럼명, 타입, FK, 인덱스 |
| `erd.md` | schema.md 시각화 | schema와 항상 동기화 필요 |
| `service_design.md` | 백엔드 구현 설계 | 기술스택, 서비스 클래스·메서드 시그니처 |
| `ml_pipeline.md` | AI 파이프라인 원본 | 파이프라인 단계·입출력·전처리·배치 실행 시각 |
| `model_spec.md` | ML 모델 설계 원본 | 베이스라인 순서, 입력피처, 출력, XAI 설계 |
| `sequence.md` | 시스템 흐름 시각화 | 소셜로그인·수요예측·발주 시퀀스 다이어그램 |
| `user_flow.md` | UX 흐름 원본 | 점주 사용 흐름, 화면 IA |
| `performance.md` | 성능 기준 원본 | API SLA, 배치 SLA, Playwright 타임아웃 기준 |
| `security.md` | 보안 정책 원본 | 토큰 정책, 암호화, 접근통제, 감사로그 항목 |
| `mvp_scope.md` | MVP 범위 원본 | 포함/제외 기능, 성공기준, 로드맵, 개발역할 |
| `docs/prompts/06_ai_handoff.md` | 06_ai 작업 인수인계 | 01~05 확정 내용 요약 |
| `docs/prompts/consistency_check.md` | 일관성 검증 체크리스트 | 교차 검증 항목 + 수정 기록 |

---

## 작업 방식

- AI가 먼저 항목을 제안하고 담당자가 확정
- 확정된 내용은 즉시 문서에 반영
- 제안 시 **추가/제외 추천 항목을 항상 함께 제시**
- 06_ai 작업 시 → `docs/prompts/06_ai_handoff.md` 먼저 읽고 시작

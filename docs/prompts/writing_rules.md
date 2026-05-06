# 설계 문서 작성 규칙

> 이 문서는 모든 설계 문서 작업 전 반드시 읽는다.
> CLAUDE.md에서 자동으로 참조된다.

---

## 핵심 원칙: 사실은 한 곳에만 정의한다

같은 내용을 두 문서에 따로 쓰는 순간 불일치가 시작된다.
한 문서에서 **정의**하고, 나머지는 **참조**만 한다.

### 사실 종류별 정의 위치 (SSOT 테이블)

| 사실 종류 | 정의 위치 | 다른 문서에서 처리 방법 |
|----------|-----------|------------------------|
| API 요청/응답 구조 | `api_spec.md` | "api_spec.md 기준" 메모만. 구조 재기술 금지 |
| DB 테이블 컬럼·타입·FK | `schema.md` | 컬럼명과 타입을 독립적으로 다시 쓰지 않음 |
| 비즈니스 규칙 (신뢰도 기준, FIFO 로직 등) | `feature_spec.md` | 해당 규칙이 나오면 "feature_spec.md 기준" 인용 |
| 서비스 메서드 시그니처 | `service_design.md` | api_spec·feature_spec 결정을 반영할 뿐, 독립 정의 금지 |
| AI Server API 계약 | `api_spec.md` (섹션 8) | `ml_pipeline.md`, `model_spec.md`는 재정의 금지 |
| 스케줄·배치 시각 | `feature_spec.md` (섹션 10) | 다른 문서는 참조만 |

---

## 작업 전 체크리스트 (3단계)

### BEFORE — 쓰기 전

- [ ] 작업 대상 문서의 **핸드오프 문서** 또는 관련 **handoff.md**를 먼저 읽는다
  - 06_ai 작업 시 → `docs/prompts/06_ai_handoff.md`
- [ ] SSOT 테이블을 보고, 지금 쓰려는 내용이 어느 문서에서 정의된 것인지 확인한다
- [ ] 정의 문서가 다른 곳에 있으면 해당 문서를 먼저 읽는다

### DURING — 쓰는 중

- [ ] 새 사실을 기술할 때: 이미 다른 문서에 있는 내용을 **그대로 재기술**하지 않는다
  - 재기술이 필요하면 `> 기준: schema.md 3.16` 형태로 출처를 명시한다
- [ ] 한 문서를 바꾸면: SSOT 테이블에서 같은 사실을 참조하는 다른 문서도 **즉시 함께** 수정한다
  - "나중에 수정" → 거의 반드시 누락된다
- [ ] 제안할 때는 **추가/제외 추천 항목을 항상 함께** 제시한다

### AFTER — 쓴 뒤

- [ ] `docs/prompts/consistency_check.md` 검증 기록 섹션에 날짜·수정 내용을 기록한다
- [ ] 새로운 결정이 생겼으면 체크리스트에 새 항목을 추가한다
- [ ] 해당 영역 handoff 문서가 있으면 함께 업데이트한다

---

## 변경 시 연동 수정이 필요한 파일 맵

아래 파일을 수정할 때 함께 확인해야 하는 파일 목록이다.

### api_spec.md 수정 시
→ `feature_spec.md` (입출력 항목 일치 확인)
→ `service_design.md` (메서드 파라미터·반환값 확인)
→ `docs/prompts/06_ai_handoff.md` (AI Server API 섹션 확인)

### schema.md 수정 시
→ `erd.md` (Mermaid 다이어그램 + 관계 구조 텍스트 모두 반영)
→ `service_design.md` (메서드 설명에서 해당 컬럼을 언급하는 곳)
→ `docs/prompts/06_ai_handoff.md` (관련 테이블 섹션)

### feature_spec.md 수정 시
→ `api_spec.md` (입출력 항목 일치 확인)
→ `requirements.md` (요구사항과 불일치 없는지 확인)

### service_design.md 수정 시
→ `api_spec.md` (메서드 ↔ endpoint 매핑 확인)

### erd.md 수정 시
→ `schema.md` (FK 제약조건과 일치하는지 확인)

---

## 자주 발생하는 불일치 패턴 (참고)

| 패턴 | 예시 | 예방법 |
|------|------|--------|
| 컬럼 재기술 불일치 | schema에 user_id 추가 → erd, service_design 미반영 | schema 수정 즉시 erd·service_design 함께 수정 |
| API 응답 필드 누락 | feature_spec에는 pos_mode → api_spec 로그인 응답에 없음 | api_spec이 정의 위치 → feature_spec은 api_spec 참조 |
| 알고리즘 조건 불일치 | feature_spec 신뢰도 기준 3가지 → model_spec에 다른 조건 | feature_spec이 정의 위치 → model_spec은 참조만 |
| 새 엔드포인트 단독 추가 | api_spec에 추가 → service_design 메서드 누락 | 엔드포인트 추가 시 서비스 메서드도 같이 작성 |
| ERD-Schema 비동기 | schema에 컬럼 추가 → mermaid 다이어그램 미반영 | schema DDL 수정 → erd.md 즉시 열어서 확인 |

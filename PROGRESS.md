# 사주라 프로젝트 진행 현황

---

## 1. 전체 단계

| 단계 | 내용 | 상태 |
|------|------|------|
| 1. 요구사항 정의 | requirements.md, usecase_spec.md | ✅ 완료 |
| 2. 기능·API·DB·백엔드·AI 설계 | docs/spec/ 전체 | ⬜ 진행 중 (backend 완료, AI 진행 중) |
| 3. 리서치 | 기술 조사·레퍼런스 분석 (docs/research/) | ⬜ 진행 중 (backend ✅, frontend ✅, ai 예정) |
| 4. 구현 계획 | 단계별 작업·순서·역할 분담 (docs/plan/) | ⬜ 예정 |
| 5. 구현 | spec/ 기준으로 개발 진행 | ⬜ 예정 |
| 6. 테스트 & 배포 | | ⬜ 예정 |

---

## 2. 작업 흐름

```
docs/research/   → 구현 전 조사 (기술 조사, 레퍼런스 분석 등)
      ↓
docs/plan/       → 구현 계획 (단계별 작업, 순서, 역할 분담)
      ↓
구현             → docs/spec/ 문서를 기준으로 개발 진행
```

- `research/`와 `plan/`의 파일명은 담당자가 자유롭게 정한다 (예: `research_lightgbm.md`, `plan_sprint1.md`)
- 조사 중인 내용은 `research/`, 미래 계획은 `plan/`, 확정된 사실만 `spec/`에 담는다
- 다음 작업의 컨텍스트와 진입점은 `HANDOFF.md` 참고

---

## 3. 정책 결정 이력

새로운 진행 방향, 기술 결정, 구조 변경 등 팀 전체에 영향을 주는 결정을 기록한다.

| 날짜 | 결정 내용 |
|------|----------|
| 2026-05-07 | 문서 구조 재편: docs/spec/, docs/research/, docs/plan/ 분리 |
| 2026-05-07 | research → plan 흐름으로 구현 작업 진행하기로 확정 |
| 2026-05-15 | 폴더 역할 명문화: spec=확정 사실, research=spec 작성 위한 조사, plan=spec 구현 계획. spec에서 "검토 예정·미정·추가 작업 필요" 항목은 research로 이동 |
| 2026-05-15 | research/ 하위에 backend/, frontend/, ai/ 도메인 폴더 도입. 단일 파일이 비대해지지 않도록 카테고리별 분할 원칙 적용 |
| 2026-05-15 | spec 폴더 읽기 순서 재정렬 (contract-first / outside-in): 요구사항 → MVP → 기능 → 흐름 → API → DB → Backend → AI → 비기능. mvp를 09→02로, flow를 07→04로 이동 |
| 2026-05-15 | 웹 프레임워크 확정: **FastAPI**. 사유 — 12개 후보 중 9개 필수 기능(async, Pydantic v2, OpenAPI, DI, multipart, BackgroundTasks, HttpOnly Cookie, 응답 스트리밍, WebSocket) 1급 네이티브 + Pydantic v2 일체화 + 생태계 최강. 처리량 우위 후보(BlackSheep 2.0~2.5x, Litestar 1.3~1.7x)가 사주라 SLA 여유 안에서 체감 차이 없음. 근거: `docs/research/backend/01_web_framework.md` §4 |
| 2026-05-15 | 애플리케이션 서버 확정: **개발 Uvicorn 단독 / 운영 Gunicorn + uvicorn.workers**. 운영 환경 Mac mini M2 Pro 16GB 기준 워커 4 + `--timeout 60 --max-requests 1000 --preload`. 근거: `docs/research/backend/02_app_server.md` §4 |
| 2026-05-15 | 리버스 프록시 확정: **Caddy v2**. 사유 — Let's Encrypt 자동화 + Caddyfile 단순성 + HTTP/2·3 기본 + Gunicorn upstream 정합. ipTIME DDNS 도메인 가정. Nginx는 처리량·캐시 튜닝 필요 시 재평가 후보로 보존. 근거: `docs/research/backend/03_reverse_proxy.md` §4 |
| 2026-05-15 | 데이터 계층 확정: ORM **SQLAlchemy 2.x async**, async 드라이버 **aiomysql**, sync 드라이버 **PyMySQL**(Alembic 한정), 마이그레이션 **Alembic**, DTO **Pydantic v2**, 설정 **pydantic-settings**, JSON 가속 **orjson**, 멀티파트 **python-multipart**, DataFrame **pandas**, 수치 **numpy**, 날짜 표준 **datetime+zoneinfo**. 보존 후보: asyncmy(DB 처리량 한계 시), polars(CSV >10만 행 시). 근거: `docs/research/backend/04_data_layer.md` |
| 2026-05-15 | 인증·암호화 라이브러리 확정: OAuth **Authlib**, JWT **python-jose**, 해싱 **passlib[bcrypt]**, 대칭 암호 **cryptography**(AES-256-GCM, 신규 spec 추가). HTTP 보안 헤더는 **Caddy `header` 디렉티브**로 엣지 처리(별도 미들웨어 미사용). 보존 후보: PyJWT(python-jose 유지보수 둔화 시), argon2-cffi(OWASP 권장 강화 시), HashiCorp Vault(300매장+). 근거: `docs/research/backend/05_auth_security.md` |
| 2026-05-15 | 외부 연동 라이브러리·알림 흐름 확정: HTTP **httpx** + 재시도 **tenacity** + 차단기 **aiobreaker** + 정적 파싱 **BeautifulSoup4(lxml)**. 브라우저 자동화 **Playwright(Chromium 단일)**. 알림 채널 — Slack **slack_sdk**(Webhook 단방향), Web Push **pywebpush**(VAPID, Google 비종속), 이메일 **fastapi-mail**(SMTP), 인앱은 BE `notifications` 테이블 + Frontend polling. 보존: browserless(BE 이미지 크기 트리거), 카카오 알림톡(Web Push 도달율 트리거). schema 신규 2개(`notifications`·`push_subscriptions`) + API 신규 5개 endpoint + `NotificationService` 추가. 근거: `docs/research/backend/06_external_integration.md` |
| 2026-05-16 | 캐시·로깅·모니터링 라이브러리 확정: 인메모리 **Redis**(spec 기존) + 클라이언트 **redis-py(async)**(신규). Service 계층에서 §9 5개 키 패턴(`forecast`·`recommend`·`dashboard`·`inventory_summary`·`refresh_token_blacklist`)을 명시적으로 호출(aiocache/fastapi-cache2 데코레이터 추상화 미채택). 구조화 로깅 **structlog** + 요청 ID **asgi-correlation-id** + 에러·성능 추적 **sentry-sdk[fastapi]**. 메트릭(Prometheus)·트레이싱(OpenTelemetry) MVP 미채택 — 매장 300+·BE 노드 2+·Sentry 한도 초과 트리거 보존. Grafana/Loki/SaaS APM 미채택. 보존: Valkey(Redis 라이선스 트리거). 근거: `docs/research/backend/07_cache_observability.md` |
| 2026-05-16 | 비동기 작업·파이프라인 확정: 짧은 후처리 **FastAPI BackgroundTasks**, 영속 잡 큐 **ARQ**(Redis 재활용, 별도 워커 컨테이너), 스케줄러는 **n8n으로 통합**(APScheduler 미채택). 데이터 파이프라인 오케스트레이션 **n8n** ratify(Airflow/Prefect/Dagster 탈락). 소비기한 일일 점검은 n8n 별도 워크플로우 매일 02:00 — `notifications` INSERT + Web Push. **데이터 품질 검증 도구(Great Expectations·Pandera)는 AI 영역(ml_pipeline 결측·이상치 처리 기준) 확정 후 결정**으로 보류. 근거: `docs/research/backend/08_async_pipeline.md` |
| 2026-05-16 | 테스트·코드 품질·미들웨어·API 문서화 확정: 테스트 7개(**pytest**·pytest-asyncio·pytest-cov·factory_boy·Faker·testcontainers-python·respx) + 코드 품질 5개(**ruff**·mypy·bandit·pip-audit·pre-commit) + 운영 미들웨어 **fastapi-limiter**(Redis Rate Limit). CORS/TrustedHost는 FastAPI 내장 채택, GZip·HTTPSRedirect·secure 미들웨어는 Caddy 처리로 미채택. API 문서는 Swagger UI + ReDoc 내장. 보존: Pact-Python·Schemathesis·pytest-playwright·Locust/k6·pyright (probe·요구 트리거). 근거: `docs/research/backend/09_testing_quality.md` |
| 2026-05-16 | 의존성·컨테이너·배포·CI 확정: 의존성 **uv**(Astral, Rust 10~100배·`uv.lock`). 컨테이너 **Docker** + **Docker Compose(V2)** 6 서비스 stack(be·arq-worker·mysql·redis·n8n·caddy). 빌드 **Buildx**(amd64+arm64 멀티 아키). CI/CD **GitHub Actions**(`requirements.md` §6.3 정합). 이미지 보안 스캔 **Trivy**(pip-audit과 보완). 보존: Kubernetes·Helm·ArgoCD/Flux(매장 1000+ 3단계 트리거). 환경 설정은 04·05에서 결정된 pydantic-settings 사용 — 본 카테고리 신규 결정 없음. 근거: `docs/research/backend/10_deployment.md` |
| 2026-05-16 | DI·유틸·결제·개발 편의 확정: DI(FastAPI Depends) · DTO(Pydantic) · PK(UUIDv4) · 시간(datetime+zoneinfo) · 결제(쿠팡 Playwright) 모두 다른 research 결정 ratify. 신규 — 운영 **phonenumbers**(stores.phone NATIONAL 형식 `010-1234-5678` 정규화), 개발 **ipython** + **rich**(dev 콘솔). 보존 — ULID(대량 INSERT 페이지 분할 트리거), PG사 SDK·Stripe(자체 결제 도입 시), Dependency Injector(BE 외 도메인 모듈 분리 시). 도구(httpie·DBeaver·n8n Desktop)는 개발자 개인 선택으로 spec 미명시. 근거: `docs/research/backend/11_misc.md` |
| 2026-05-16 | 보안 정책 미확정 항목 정리: **RBAC** MVP 단일 역할 점주 종결(2단계 매트릭스는 그때 설계). **감사 로그** 보관 1년 / 조회 `ops_readonly` / DB append-only + 백업. **다중 디바이스** 각 디바이스 자체 토큰 자연 동작 명시. **강제 로그아웃** 채택 — 모든 디바이스 일괄 폐기 `POST /api/auth/logout-all` 신규. AES-256 적용 대상 현 상태 유지. **쿠팡 자격증명** 검증 보류 — (E) 점주 브라우저 게스트 장바구니 → (C) 세션 쿠키 → 재논의 단계적 fallback. 외부 API scope·rate limit은 13(2단계)·AI 영역 의존으로 보류. 근거: `docs/research/backend/14_security_open_items.md` |
| 2026-05-16 | **스케줄러 책임 분리 정정** (08 §1.4 정정): `n8n` = **AI 파이프라인 자동화만** (외부 API 수집·AI Server 호출 등 ML 흐름). `ARQ cron_jobs` = **BE 도메인 정기 작업** (소비기한 일일 점검·단가 갱신·이메일 예약 등). 점주 알림은 BE `NotificationService.create_and_push` 일관 처리 — n8n은 BE API 트리거만, DB `notifications` 직접 INSERT 안 함. `n8n_user`의 `notifications` SELECT/INSERT 권한 회수. 사유: n8n은 AI 워크플로우 도구로 BE 재고 도메인 cron에 책임 부적합. 근거: 본 검증 audit (16차) |
| 2026-05-16 | **Frontend 후속 정합 5건 일괄 반영** (18차 audit): (A-1) 인앱 알림 폴링 **5분 고정·코드 상수** + 사용자 설정 제거 + 수동 새로고침 버튼 권장 — BE rate limit 60/min 보호. (A-2) **FE Sentry 도입 확정** — `@sentry/react` ^8 + `@sentry/vite-plugin` ^2. BE와 동일 SaaS·동일 release(`git-<sha-short>`)로 상관관계. `sendDefaultPii: false` + `beforeSend` 마스킹(Authorization·Cookie·이메일·전화·사업자번호) + 소스맵 Sentry 업로드 후 `deleteFilesAfterUpload: true`로 public 차단 + `sampleRate=1.0`/`tracesSampleRate=0.05`(1개월 관찰 후 조정). 세션 리플레이 미사용(PII 위험). (A-3) CSP `connect-src` Sentry SaaS 허용 — frontend 08 §3.4 + backend 03·05 Caddyfile `connect-src 'self' https://*.ingest.sentry.io`로 정합. (A-4) **OAuth callback 응답 방식 정정** — api_spec.md §2 `GET /api/auth/callback/{kakao,google}` 응답을 "200 JSON" → "**302 Redirect to FE root + Set-Cookie refresh_token**"으로 정정. Access Token은 FE 첫 진입 시 `POST /api/auth/refresh`로 동기 (URL·body·history 노출 차단). sequence.md §2 alt 블록 + feature_spec.md §1.1 OAuth 흐름 정합 갱신. (A-5) FE Sentry release tagging — performance.md §5에 FE Sentry 1행 추가(release `git-<sha-short>`·`VITE_APP_VERSION`). 근거: `docs/research/frontend/11_observability.md`(신규) + 02·06·08 갱신 |
| 2026-05-16 | **MVP 데이터 소스 정책 확정 (CSV-only)** + **MVP/2단계 라벨링 도입** (19차 audit): mvp_scope.md가 "보유 주점 POS 데이터 → CSV 업로드"를 MVP 유일 데이터 경로로 정의한 사실과, 다른 spec(`requirements`·`usecase_spec`·`feature_spec`·`user_flow`·`sequence`)이 "CSV 임시 모드에서는 예측·발주 비활성화"로 남아 있던 정책 충돌을 mvp_scope.md 기준으로 일괄 정합. CSV 모드도 수요예측·자동발주 추천 활성화로 통일. 동시에 모든 spec(`feature_spec`·`api_spec`·`service_design`·`performance`)의 POS API·ROI 대시보드·주간 재학습·데이터 export/delete·Cold-start 항목에 **`[MVP]`/`[2단계]` 배지 표기 도입**(헤더 또는 표 컬럼). consistency_check.md §15-1 "MVP 정책 전환 시 동시 점검 파일" 게이트 신설. 사유: 16차 이후 mvp_scope.md만 갱신되고 나머지가 옛 정책에 머물러 "MVP 데모가 spec상 불가능"한 표류 발생. 근거: 본 19차 audit |
| 2026-05-16 | **FE spec 폴더 신설** (19차 audit): `docs/spec/07_frontend/frontend_design.md` 신규 — Frontend 구현 SSOT. 라우팅·상태·인증 통합·PWA·OpenAPI 코드젠·CI 설계 포함. 기술 스택 상세는 `research/SUMMARY.md` §11~18 참조 패턴(중복 정의 없음). docs/README.md·research/README.md frontend 표 연결 spec 일괄 갱신. 사유: FE 확정값이 research/SUMMARY에만 머물러 "spec=확정 사실" 원칙 위반. 근거: 본 19차 audit |
| 2026-05-16 | **n8n 알림 책임·결제 보안 문구 정합** (19차 audit): `service_design.md` §250 NotificationService 안내문에서 "n8n 배치도 DB에 직접 INSERT" 옵션 삭제 → BE API 호출로 단일 경로 단언(16차 결정과 schema.md §511 정합). `security.md` §6 결제 — "PG사 토큰화·자체 서버에 토큰값 저장" 문구 삭제 → "결제는 쿠팡에서 수행, 사주라 미경유·미저장" 단언(쿠팡 직접결제 모델과 정합). 근거: 본 19차 audit |
| 2026-05-16 | **Frontend 스택 일괄 확정** (research/frontend 01~10): 프레임워크·빌드 **React 19 + Vite 6 + TypeScript 5.x (strict)**. 라우팅 **React Router v7**, 클라이언트 상태 **Zustand 5**(auth 메모리·preferences persist 물리적 분리). 서버 상태 **TanStack Query v5** + HTTP **ky 1.x**(fetch wrapper·`credentials: include`·401 단일 refresh 인터셉터) + 코드젠 **openapi-typescript 7.x**(타입만). UI **Tailwind CSS v4 + shadcn/ui(Radix) + lucide-react**. 폼·검증 **React Hook Form 7 + zod 3 + @hookform/resolvers/zod**(BE Pydantic v2 1:1 매핑). PWA **vite-plugin-pwa + injectManifest 모드**(SW push·notificationclick 커스텀 핸들러), VAPID 공개 키 **환경변수 inline**, 인앱 알림 **TanStack Query `refetchInterval` 30s + 백그라운드 비활성**. 차트 **Recharts 2.x**(shadcn chart 통합). OAuth **BE 인가 URL 리다이렉트 + 첫 진입 refresh + `/api/auth/me`**, Access Token **Zustand 메모리(persist 금지)**, Refresh **HttpOnly Cookie 자동 송수신**. CSP **`script-src 'self'` + `style-src 'self' 'unsafe-inline'` + `worker-src 'self'` + `manifest-src 'self'`** (PWA·Radix·Recharts 정합) — backend 03·05 Caddyfile에 정합 갱신. 테스트 **Vitest 2 + @testing-library/react 16 + MSW 2 + Playwright(Node) Chromium 단일**, 린터 **Biome 1.x**(+Tailwind 정렬은 prettier-plugin-tailwindcss 보조), 타입 **tsc + vite-plugin-checker**, Storybook 보존. 배포 **pnpm 9 + Node 22 LTS + Caddy 이미지 자체 빌드(FE dist COPY) + GitHub Actions 8단계**. 보존 후보: Next.js(SEO 트리거)·TanStack Router(라우트 50+)·Jotai(상태 20+)·axios(업로드 진행률)·openapi-fetch(path 오타)·valibot(스키마 30+)·Mantine(컴포넌트 추가 비용)·Chart.js(데이터 1000+)·ESLint+Prettier(Biome 미지원 규칙)·Storybook(컴포넌트 30+)·npm(pnpm 호환 문제). 근거: `docs/research/frontend/01_*.md` ~ `10_*.md` |
| 2026-05-16 | **AI 외부 데이터 미확정 항목의 분류 기준 확정** — 미확정으로 분류된 외부 데이터(경제지표·검색량·SNS 노출도·프로모션 등)는 (1) **활용 의도는 확정**(예측 모델 입력 피처로 사용할 의도 명확), (2) **기술 가능성(수집 출처·수단)만 조사 중** 상태로 정의. spec에서 해당 단어를 삭제하지 않고 유지하되, 등장하는 모든 위치에 "조사 중" 표기를 통일 부착하여 미확정성을 가시화. 사유: 단순 미확정으로 처리하면 모두 삭제 대상이 되어 활용 의도 정보가 손실됨. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-16 | **결측값 보간 방법·적용 기준 — research 분리 확정** — spec에는 "n8n 전처리에서 결측값을 처리한다"는 사실만 유지. 구체적 보간 방법(전일 평균·이동평균·0 채움 등)·적용 대상별 규칙은 `docs/research/ai/02_ml_pipeline_open_items.md` §3에서 결정. `ml_pipeline.md` §10 미확정 안내에서 "결측" 부분 분리·재명시, `prompts/08_ai_handoff.md` 작업 체크박스에서 "결측값 처리 규칙 상세" 항목 제거. 사유: 실데이터 확보 전에는 어떤 보간 방법이 적합한지 결정 불가, research에서 후보 비교 후 spec에 역반영하는 흐름이 정합. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **`docs/spec/prompts/consistency_check.md` 폐기** — 점검 항목 표가 spec 변경 속도를 따라가지 못해 오히려 정합성 점검을 가로막음. 폐기 후 spec/research 일관성은 (1) PROGRESS.md §3 정책 결정 이력, (2) 각 spec 본문의 명시적 안내문, (3) 변경 시 grep 기반 잔존 검증으로 대체. `docs/spec/prompts/` 폴더는 빈 상태(이전 결정으로 `08_ai_handoff.md`도 폐기). 참조 정리: `docs/README.md` SSOT 표 1건, `docs/사주라_기술문서.md` 2건, `docs/research/ai/01_model_selection.md` 1건. 사유: 점검 항목 유지 비용이 효익을 초과, 작업 모델 단순화. 근거: 본 미확정 AI 항목 검토(20차) |
| 2026-05-17 | **예측 근거 — 산출 방법(SHAP/FI)·출력 형태(자연어·Top-3)·초기 모델(LightGBM) 모두 research로 위임** — 사용자 결정: "어떤 AI를 쓸지 모르고, 자연어 답변 여부도 미지수". spec 다수 위치에서 (1) "초기 AI 모델 = LightGBM" 단정 제거(`model_spec.md` §2 표·§3·§9, `ml_pipeline.md` §3·§7), (2) "예측 근거 = SHAP + Feature Importance" 단정 제거(`feature_list.md` §2.6·기능표, `feature_spec.md` §5·§9·§12, `requirements.md`, `usecase_spec.md`, `ml_pipeline.md` §9, `sequence.md`), (3) "출력 형태 = Top-3 자연어" 단정 제거(`feature_spec.md` §9.1 자연어 템플릿 코드블록 삭제, `model_spec.md` §6·§9), (4) **DB 컬럼 삭제** `forecast_results.explanation_text`·`top_factors`(`schema.md` §3.15), (5) **AI Server API 삭제** `POST /ai/xai/shap`(`api_spec.md` §8), (6) **AIServerClient 메서드 삭제** `get_shap`(`service_design.md`), (7) `mvp_scope.md` §3·§5·§9의 "XAI" 표현 4건 추상화. 모든 위치에 "산출 방법(SHAP·Feature Importance·기타 후보)·출력 형태(자연어·표·수치 등)는 `docs/research/ai/01_model_selection.md` §3 확정"으로 통일. research §2 헤더 격상 + §3 표에 통합 행 추가. `consistency_check.md` §6 점검 항목도 추상화. 베이스라인 비교 후보 목록·기존 신뢰도 낮음 컬럼(`is_low_confidence`)·예측 결과 핵심 컬럼은 유지. 사유: 모델·산출 방법·출력 형태 각 결정이 서로 종속(예: 자연어 출력이면 explanation_text 컬럼 필요), 어느 하나라도 사실로 박아두면 다른 결정을 묶어버림. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **DNN 도입 여부 — 기술 스택 가정 자체를 research §2.1로 위임** — `model_spec.md` §3에 "PyTorch 기반 DNN도 기술 스택에 포함된다"가 사실처럼 적혀 있었으나, DNN 도입 자체가 미확정. spec을 "DNN 계열(PyTorch 등) 도입 여부는 미확정 (research §2.1 확정)"로 추상화. research `01_model_selection.md` §2.1 헤더를 "**DNN 도입 여부 및 LightGBM ↔ DNN 전환 기준**"으로 격상하고 조사 항목에 "도입 여부 자체"를 명시. 사유: 기술 스택을 사실로 박아두면 후보 검토 없이 도입이 기정사실화될 위험. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **평가 지표 선정 — MAPE 사용 여부 자체를 research §3로 위임** — spec 12곳(`requirements.md` §5, `feature_list.md` ROI·신뢰도 행, `user_flow.md` 대시보드 차트, `api_spec.md` `/api/dashboard/roi`, `service_design.md` `get_roi`, `mvp_scope.md` ROI 행·예측 품질 기준, `feature_spec.md` ROI 산식 표·대시보드 차트·신뢰도 경고 사유, `consistency_check.md` §6)에서 "MAPE" 단어 모두 제거하고 "**예측 정확도 지표**(지표 선정은 research §3)" 추상 표현으로 통일. research `01_model_selection.md` §3 표 "평가 지표 선정(MAPE 사용 여부 포함) 및 목표 성능" 행으로 보강, §4 헤더에 "§4.1 잠정 임계값은 지표=MAPE 가정 placeholder, §3 결정 후 §4 재검토" 안내 추가. spec 잔존 MAPE 0건 검증. 사유: MAPE는 단순 후보 중 하나이며 실데이터로 RMSE/MAE/bias 등과 함께 비교 후 결정해야 함, spec에 MAPE를 사실로 박아두면 다른 지표 검토를 차단. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **재학습 후 모델 교체 기준·배포 승인 기준 — research §6에서 통합 결정** — 두 항목이 같은 결정 사슬(새 모델 검증→교체 임계값→자동/수동·롤백)에 속함을 명시하고 `02_ml_pipeline_open_items.md` §6 헤더를 "재학습 후 모델 교체·배포 승인 기준"으로 통합. `01_model_selection.md` §3 표의 중복 행("재학습 후 배포 승인 기준")은 §6 참조로 압축. spec 변경 없음(spec에는 처음부터 정책 본문이 없고 `ml_pipeline.md` §10 미확정 안내만 존재). 사유: 두 결정을 분리해서 다루면 임계값과 배포 절차가 따로 결정될 위험. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **Cold-start — 전략 자체는 [2단계] spec 유지, 파이프라인 분기 로직만 research 이동** — spec(`feature_spec.md` §5.4 [2단계], `feature_list.md` 수요예측, `mvp_scope.md` §3·§5)에 적힌 Cold-start 전략(유사 매장 기반 예측·`stores.business_type`+`store_size`+`operation_type` 동일 매칭·신뢰도 낮음 배지 필수·자체 데이터 30일 후 자동 전환)은 spec 유지. 파이프라인 분기 로직(분기 판정 위치 n8n/AI Server·유사 매장 매칭 알고리즘·매칭 결과 0개 대응·전환 트리거)은 `docs/research/ai/01_model_selection.md` §3 표 "Cold-start 파이프라인 분기 로직" 행으로 이동. `feature_spec.md` §5.4 말미에 research 안내 1행 추가. 사유: 전략 자체는 도메인 결정이 끝났으나 구현 단계 흐름은 매장 풀이 충분히 쌓이고 매칭 알고리즘 후보 비교 가능해진 시점에 확정. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **`docs/spec/prompts/08_ai_handoff.md` 폐기** — research 완료 후 곧바로 `docs/spec/08_ai/*.md`에 확정 사실을 역반영하는 흐름으로 작업 모델 단일화. 별도 인수인계 문서 불필요. 동시에 spec/research 8건 참조(`docs/README.md` SSOT 테이블·파일 맵 5건, `consistency_check.md` 2건, `research/ai/01_model_selection.md` 2건) 모두 정리. 사유: handoff가 spec 사이의 중계 노드처럼 작동해 SSOT 위반(같은 임계값이 3곳에 중복 정의 등) 발생 위험. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **학습 데이터 사용 방식 — 슬라이딩 윈도우 가정 자체를 research 이동** — spec(`ml_pipeline.md` §2, `model_spec.md` §7)이 "최근 N개월 슬라이딩 윈도우"를 사실처럼 적고 있었으나 방식 자체가 미확정. spec에서 슬라이딩 윈도우 문장·"N개월" placeholder를 모두 제거하고 `docs/research/ai/02_ml_pipeline_open_items.md` §2(슬라이딩 윈도우 / 전체 누적 / 시간 가중치 / 시즌별 분할 후보 비교)로 이동. `prompts/08_ai_handoff.md` 작업 체크박스·참고 미확정 표·`ml_pipeline.md` §10 미확정 안내 문구도 "학습 데이터 사용 방식(슬라이딩 윈도우 적용 여부 포함)"으로 일괄 통일. spec에는 "주간 단위 정기 재학습"·"배치 학습" 같은 합의된 사실만 유지. 사유: 어떤 학습 데이터 사용 방식이 적합한지(고정 윈도우 vs 가중치 vs 누적)는 데이터 확보·probe 없이 결정 불가, 슬라이딩 윈도우 단정이 다른 방식 검토를 차단. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-17 | **이상치 탐지 — 사실만 spec 유지, 방법론·정책 전부 research 이동** — spec(`requirements.md` §3, `ml_pipeline.md` §6, `feature_spec.md` §4.6·알림 표, `feature_list.md` POS 연동, `sequence.md` §판매 동기화, `user_flow.md` 알림 표, `service_design.md` 라이브러리 표)에서 IQR/Z-score 방법론 명시·5% 임계값·5% 미만 자동 분리/이상 알림 트리거·"이상 데이터 분리" 정책을 모두 제거하고 `docs/research/ai/02_ml_pipeline_open_items.md` §3로 이동. spec에는 "이상치 탐지를 수행한다"는 사실만 남기고 모든 위치에 "탐지 방법·임계값·처리 정책은 research §3 확정"으로 통일 안내. research §3에 §3.1 결측 보간·§3.2 이상치 탐지 방법·§3.3 처리 정책·§3.4 probe 후 spec 역반영 대상을 소항 분리. 동시에 `mvp_scope.md` 데이터 확보 방식 §8 각주의 "30일 미만·MAPE 20% 초과" 잠정 임계값(직전 결정에서 누락분)도 함께 정리. 사유: 두 탐지 방법 중 컬럼별 적용 조건·임계 계수·분리 vs 수정 선택지가 모두 실데이터 없이는 결정 불가, 잠정값이 spec에 박혀 있으면 probe 단계 누락 위험. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |
| 2026-05-23 | **Git 브랜치 전략 확정** — 베이스 브랜치 4개(`main`·`ai`·`dev`·`be`·`fe`) 생성·원격 푸시. 머지 흐름: be+fe는 `feat/be-*`/`feat/fe-*` → `be`/`fe` → `dev` → `main`, AI는 별도 서버로 독립 배포되어 `ai` → `main` 직행(`dev`와 합치지 않음, be+fe와는 HTTP API로만 연동). 피처 브랜치 네이밍 `feat/be-<name>`·`feat/fe-<name>`. GitHub main 보호 적용: 직접 푸시 금지·PR 필수(승인 의무 없음)·force push/삭제 차단·`enforce_admins=false`(레포 admin인 담당자는 문서류 직접 푸시 가능). 사유: AI 모델링은 다른 팀원 담당이고 AI 서버가 별도 배포 단위, be+fe만 통합 검증 필요. 근거: README.md §5 브랜치 전략 |
| 2026-05-16 | **신뢰도 낮음 임계값·MVP MAPE 목표 — AI probe 후 확정으로 분리** — spec에 잠정값으로 적혀 있던 정량 기준(MAPE 20% 초과 / 학습 30일 미만 / 결측 30% 초과 / MVP MAPE 목표 30% 이하)을 모두 spec에서 제거하고 `docs/research/ai/01_model_selection.md` §4로 이동. spec(`feature_spec.md` §5.3, `feature_list.md` 수요예측 섹션, `mvp_scope.md` 예측 품질 기준, `prompts/08_ai_handoff.md` §8)에는 "정량 임계값은 AI probe 후 확정, research §4 참조"로 일괄 대체. `consistency_check.md` §6에 임시 숫자 재유입 방지 점검 행 추가. 신뢰도 낮음 개념·배지·DB 컬럼(`forecast_results.is_low_confidence`, `low_confidence_reason`)은 구조로 유지. 사유: 실제 모델 학습·평가 없이 임계값 확정 불가, 잠정값이 spec에 "확정"으로 박혀 있으면 검증 단계가 누락될 위험. 근거: 본 미확정 AI 항목 검토(20차 진행 중) |

---

## 4. 문서 수정 이력

spec/ 문서 작성·수정 내용을 날짜 역순으로 기록한다.

### 2026-05-27 (28차) — Phase 3 사후 정리: 브랜치/HANDOFF/문서 작업 규칙 정합

**머지 완료된 피처 브랜치 삭제**

- `feat/be-auth` (PR #7로 `be`에 머지 완료) · `feat/fe-auth` (PR #8로 `fe`에 머지 완료) — 원격(`origin/feat/*`) + 로컬 모두 삭제
- 결과: 장수 브랜치 5개(`main`·`dev`·`be`·`fe`·`ai`)만 잔존
- outdated stash 1건(`WIP: BE phase 3 (M3.B1~B7 in progress)` — PR #7로 이미 통합된 옛 스냅샷) drop

**HANDOFF.md slim down (213→107줄, 50% 감축)**

- stale 4개 섹션 제거:
  - `작업 1: frontend 리서치 ✅` — 상단 "본인이 결정·검토한 spec" 표와 중복
  - `작업 2: spec/08_ai 정리 ✅` — 동일 중복
  - `작업 A: BE/FE plan 작성 ⬜` — **실제로는 21차/23차 audit에서 ✅ 완료**, 상단 표와 모순되는 stale
  - `작업 B: BE/FE 구현 ⬜` — Phase 2/3 ✅ 완료, 상단 표 B/C/D와 모순되는 stale
- 중복 표 1건 제거: `다른 담당자 영역` 표가 바로 아래 "AI 팀 결과 대기 중" 섹션과 중복
- Phase 3 통합 결과(2026-05-26) + Phase 4 진입 메모로 우선순위 행 갱신 (E=dev→main 통합, F=Phase 4 POS)

**문서 작업 규칙 — main 동기화 의무화 (충돌·덮어쓰기 방지)**

- `README.md` §5: "⚠️ 문서 작업 시작 전 필수 절차 — 최신 main 동기화" 블록 신설. main 전용 문서(PROGRESS·docs/spec·docs/plan·루트 README·CLAUDE·AGENTS) 수정 전 `git checkout main && git fetch origin && git pull --ff-only origin main` 의무화. admin 직접 푸시 / 팀원 PR 분기 2가지 경로 표 + 머지 후 장수 브랜치 back-merge 절차 명시
- `CLAUDE.md` · `AGENTS.md`: 핵심 규칙 3→4로 확장. 규칙 4에 동일 사항 명시 + README §5 참조. AI 에이전트(Claude·Codex)도 동일 규칙 준수 명령
- 사유: 옛 main 상태에서 곧장 수정 시 다른 팀원/이전 세션 변경분 덮어쓰기·머지 충돌 발생 위험

**변경 파일**: `PROGRESS.md`(본 항목) · `HANDOFF.md` · `README.md` · `CLAUDE.md` · `AGENTS.md`

### 2026-05-26 (27차) — Phase 3 인증·온보딩 구현 (BE M3.B1~B7 + FE M3.F1~F6)

**BE Phase 3 (`feat/be-auth` → `be`, PR #7)**

- 라이브러리: Authlib(OAuth) + python-jose(JWT) + passlib[bcrypt] + cryptography(AES-256-GCM) — `security.md` §2·§4.1 정합
- `AuthService` — 이메일 로그인(M3.B1) + 카카오/구글 OAuth 콜백 → Refresh HttpOnly Cookie + FE root 302 redirect (`api_spec.md` §2)
- `StoreService` — 매장 정보 등록/조회/PATCH + 소프트 삭제 + `POST /api/store/onboarding/complete` 멱등 처리(M3.B2)
- 국세청 사업자등록번호 검증 어댑터 (`integrations/nts.py`) — 키 미설정 시 stub 통과 모드(M3.B3)
- `POST /api/auth/logout-all` — 모든 디바이스 Refresh 일괄 폐기 (`security.md` §2.3)(M3.B4)
- `auth_test` BE 통합 테스트 12개 (pytest + testcontainers)(M3.B5)
- POS stub API — Phase 4 실연동 전 화면 흐름 막힘 방지용 mock 200 응답(M3.B6)
- `MenuService` — 메뉴 CRUD + `POST /api/menus/bulk`(중복 메뉴 skip 응답)(M3.B7)
- 사후 수정: FastAPI 0.115 호환 — 204 응답 라우터에 `response_model=None` 명시 (`f53c5d4`)

**FE Phase 3 (`feat/fe-auth` → `fe`, PR #8)**

- 라우터·가드: React Router v7 data router + `RequireAuth`·`RequireGuest`(부트스트랩 완료·onboarding_completed 상태 분기)(M3.F1, M3.F2)
- Auth 부트스트랩: 마운트 1회 `POST /api/auth/refresh` → 메모리 Access Token 동기 + `GET /api/auth/me`로 `user.onboarding_completed` 확보 (`frontend_design.md` §2)
- 로그인 화면(`/login`): 카카오·구글 버튼 → BE `/api/auth/login/{provider}` 302 진입(M3.F1)
- 온보딩 4스텝 폼 (React Hook Form + zod + `@hookform/resolvers/zod`):
  - Step 1 매장 정보 — phone 자동 마스크(`0xx-xxxx-xxxx`)(M3.F3)
  - Step 2 POS 연동 — `CSV_ONLY`/`UNIONPOS`/`OKPOS`/`POSBANK` 선택, CSV_ONLY는 자격증명 생략(M3.F4)
  - Step 3 메뉴 등록 — `useFieldArray` 동적 배열(M3.F5)
  - Step 4 확인·제출 — `PATCH /api/store` → (POS 등록 옵션) → `POST /api/menus/bulk` → `POST /api/store/onboarding/complete` 순차 호출 후 메인 진입(M3.F6)
- 스토어 분리: Zustand `useAuthStore`(메모리 Access Token + user) / `useOnboardingStore`(스텝 간 폼 캐시) — persist 미들웨어 미사용
- 단위 테스트: 폰 마스크·zod 스키마 검증 (Vitest 8 케이스 통과)
- Playwright E2E 시나리오(`src/test/e2e/auth-onboarding.spec.ts`) — BE 미가용 상태에서도 `page.route`로 라우트 인터셉트하여 라우팅·가드·폼 흐름 검증(M3.F7 스캐폴드 — 실 BE 통합 검증은 BE M3.B1~B3 완료 후)
- 빌드/타입 검증: `pnpm typecheck` ✓ · `pnpm test` 8/8 ✓ · 앱 영역 `tsc -p tsconfig.app.json` ✓ (사전 존재 `sw.ts` workbox-precaching 미설치는 Phase 2 베이스라인 결함, 별도)

**브랜치 통합**

- PR #7 `feat/be-auth` → `be` 머지 / PR #8 `feat/fe-auth` → `fe` 머지
- PR #9 `be` 후속 정리 / PR #10 `fe` 후속 정리 — be/fe 베이스 동기화 완료

**변경 파일**

- BE: `Back/app/api/{auth,oauth,store,pos_stub,menu,deps}.py`, `Back/app/services/*`, `Back/app/models/*`, `Back/app/schemas/*`, `Back/app/integrations/nts.py`, `Back/app/core/{errors,security}.py`, `Back/app/db.py`, `Back/app/{config,main}.py`, `Back/pyproject.toml`
- FE: `Front/src/routes/{login,home,router,guards}.tsx`, `Front/src/routes/onboarding/{layout,step-store,step-pos,step-menus,step-confirm}.tsx`, `Front/src/api/endpoints/{auth,store,menus}.ts`, `Front/src/stores/{auth-store,onboarding-store}.ts`, `Front/src/schemas/onboarding.ts`, `Front/src/features/auth/use-auth-bootstrap.ts`, `Front/src/components/ui/{button,field}.tsx`, `Front/src/App.tsx`, `Front/src/lib/api.ts`, `Front/src/test/{smoke.test.tsx,onboarding-schema.test.ts,e2e/auth-onboarding.spec.ts}`, `Front/{package.json,playwright.config.ts,vitest.config.ts,pnpm-lock.yaml}`

### 2026-05-25 (26차) — Phase 2 인프라 부트스트랩 구현 + main 베이스라인 통합

**구현 시작 — 3트랙 부트스트랩 (M2.B1~B4 / M2.F1~F6 / AI skeleton)**

- BE (`feat/be-infra-bootstrap` → `be`): FastAPI + Alembic + pydantic-settings + structlog/asgi-correlation-id/Sentry 미들웨어 + `GET /health` + schema.md §3 전체 23개 테이블 마이그레이션
- FE (`feat/fe-infra-bootstrap` → `fe`): Vite 6 + React 19 + TS strict + Tailwind v4 + shadcn + TanStack Query v5 + ky 1.x 401 단일 refresh 인터셉터 + openapi-typescript 코드젠 + vite-plugin-pwa(injectManifest) + @sentry/react + Biome + Vitest + multistage caddy Dockerfile
- AI (`feat/ai-infra-bootstrap` → `ai`): FastAPI 빈 스켈레톤 + `GET /ai/health` (`api_spec.md` §8 정합, `model_loaded=false`)

**Docker 구조 단일 루트 `/docker/` 통합 + 루트 컨텍스트 전환**

- `Back/Docker/*` → `/docker/{be,arq,mysql,caddy,n8n}/`로 이동, FE 부트스트랩 시 `docker/fe/` 추가, AI 부트스트랩 시 `docker/ai/` 추가
- compose 모든 서비스 `context: .` + `dockerfile: docker/<svc>/Dockerfile` 통일
- Back/ARQ Dockerfile COPY 경로 `Back/...` 갱신, caddy `docker/caddy/Caddyfile` 갱신
- 사유: 3트랙 + 인프라 4개 규모에서 인프라 정의 한 곳 집약이 탐색·일관성 우위

**docker compose 실제 검증 (로컬)**

- 6/6 컨테이너 healthy (be · arq-worker · mysql · redis · n8n · caddy)
- `alembic upgrade head` → schema.md §3 전체 23개 테이블 + alembic_version 생성
- `GET /health` 200 (be:8000 직접 + caddy:80 프록시 경유)

**검증 중 발견 → 즉시 수정 (4건)**

- `docker/be/Dockerfile`: gunicorn `--keepalive` → `--keep-alive` (CLI flag 오타)
- `Back/pyproject.toml`: `cryptography==44.0.0` 추가 (MySQL 8 `caching_sha2_password` 인증 요구)
- `Back/app/worker.py`: ARQ가 함수 0개로는 기동 거부 → Phase 2 placeholder `_noop` 함수 추가
- `Back/App` → `Back/app` 케이스 정규화 (Docker COPY 대소문자 인식)

**README §5 협업 규칙 명문화**

- 트랙 간 동기화 (be ↔ fe) 4가지 규칙: Contract-first(api_spec.md + MSW mock 선행) / be·fe → dev promote / dev → be·fe back-merge / 미머지 feat 우선 마무리
- 문서 커밋 위치 표: spec·plan·PROGRESS·루트 README는 main 직접(admin) 또는 `docs/<주제>` PR / 코드 옆 README는 해당 트랙 / HANDOFF는 .gitignore

**브랜치 통합 (Phase 2 베이스라인)**

- PR #1 BE → be 머지 / #2 FE → fe 머지 / #3 AI → ai 머지 (각 트랙 base)
- PR #4 dev → main 머지 / #5 ai → main 머지 (Phase 2 통합)
- 모든 장수 브랜치 5개 동일 commit (`34dc58a`) 정렬 — main = dev = be = fe = ai
- 옛 `kick_off` 원격 브랜치 삭제

**변경 파일**: Back/(pyproject.toml, app/*, alembic/*, alembic.ini) · Front/(package.json, src/*, vite.config.ts, tsconfig.*, biome.json, vitest.config.ts) · AI/(pyproject.toml, app/*, README.md) · docker/(be, arq, mysql, caddy, n8n, fe, ai) · docker-compose.yml · .env.example · README.md · .gitignore

### 2026-05-24 (25차)

`docs/plan/` BE/FE 21개 phase 파일을 `/plan-eng-review` 스킬 기준 경량 검토(A안: BE+FE 짝지어 phase별 관찰사항 보고, 추천·판단 금지 메모리 규칙 준수). 10개 정합성 오류·누락 항목을 사용자 답변에 따라 일괄 정정.

**A. spec 폴더 경로 정정 (Q1)** — BE plan 4곳에서 `04_api`·`05_db`·`06_flow` 옛 경로 → 신규 `05_api`·`06_database`·`04_flow`. 2026-05-15 폴더 재배치 시 plan 쪽 따라오지 못한 잔재.

**B. FE 알림 폴링 주기 정정 (Q2)** — `phase_09 M9.F5` 30s → **5분** (18차 A-1 결정, 코드 상수·사용자 설정 제거).

**C. Phase 03 온보딩 4스텝 ↔ BE 일정 모순 해결 (Q3)** — POS는 조사 미완으로 phase_03에 stub API(M3.B6, mock 200) 신설, 실연동은 phase_04 그대로. 메뉴는 조사 완료 영역이라 **MenuService 자체를 phase_05 → phase_03 M3.B7로 이동**. phase_05는 M5.B1 결번 없이 재번호(M5.B1 Inventory·B2 Sale·B3 ARQ). FE M3.F4 검증 "API 연결 테스트 버튼 통과" → "화면 흐름 진행 가능 (stub 200)" 약화. BE phase_03·04 외부 의존에 POS 조사 상태 명시.

**D. BE phase_12 Day 33 시작일 모순 해결 (Q4)** — 의존 skeleton 종료가 Day 38·42·49인데 시작 Day 33은 매칭 안 됨(오타). phase_12를 단일 덩어리에서 마일스톤별 분산 실행으로 재해석: M12.B1 Day 38~, B2·B3 Day 42~, B4 Day 49~. 헤더 Day 38~49로 정정.

**E. 데모 시나리오 9단계 SSOT 정의 (Q5)** — phase_13의 6단계 정의와 phase별 Step 번호 불일치 해소. 실제 시연 흐름에 맞춰 **9단계로 확장**: 1.로그인 2.온보딩 3.CSV 4.메뉴·재고·판매 5.n8n야간예측 6.수요예측 7.추천발주 8.대시보드·알림 9.쿠팡자동주문. phase_13 BE에 SSOT 표 추가. 모든 phase 종료 조건 Step 번호 및 plan_gantt.md 갱신.

**F. 알림 채널 책임 분리 (Q6)** — phase_11 NotificationService 4채널에서 **Slack 제거 → 점주용 3채널(인앱·Web Push·이메일)**. phase_08 M8.B5·phase_10 M10.B3의 Slack은 **운영자 모니터링 전용**으로 명시.

**G. 폴링·배치 정합 (Q7)** — FE M10.F2 자동화 폴링 = **30초**(진행 중일 때만, 완료 시 정지). ARQ cron 02:00 ↔ n8n run 02:00 동시각 충돌 해소: **ARQ 01:30 / n8n 02:30** 분산.

**H. 산출물·정합성 비대칭 6항목 (Q8)** — ① FE phase_00 spec 신설은 research 부산물로 그대로 유지 ② BE M5.B3에 "FE 대응 없음 — BE 단독" 명시 ③ FE phase_04·09·11에 "디자인 사전 합의 권장" 노트 추가(phase_12 패턴 확장) ④ phase_12 hookup 후 회귀 마일스톤 신설(BE M12.B5·FE M12.F5) ⑤ 데모 시드 데이터를 phase_03/04/05/08/09/10/11 종료 조건에 분산 명시 ⑥ BE research `12_*` 결번 의도 표시.

**I. 미정의 항목 spec 참조 추가 (Q9)** — CSV 포맷·필수 컬럼(spec/03_feature_design/feature_spec.md §4.4), VAPID(spec/07_frontend §환경변수), AES-256-GCM(spec/09_nonfunctional/security.md §4.1), 외부 데이터 4종(spec/08_ai/ml_pipeline.md) — plan 산출물 칸에 spec 위치 링크 추가.

**J. SLA 강도 명확화 (Q10)** — spec/09_nonfunctional에 정식 SLA 정의 없음 → plan 자체 기준임을 명시. M13.B2 보안 High/Critical 0건은 **강행(배포 차단)**, M13.F2 Lighthouse 90+는 **목표(차단 아님, 시연 변동성 인정)**.

**변경 파일**: BE plan 11개, FE plan 9개, plan_gantt.md (총 21개 plan 파일 수정).

### 2026-05-24 (24차)

외부 데이터 소스 조사 완료. 대상 지역을 세종 조치원 홍익대 상권으로 확정하여 데이터 수집 가능성 검토.

- `docs/research/ai/03_external_data_sources.md` 신규 작성
  - 날씨: 기상청 단기예보 API (무료, MVP 필수)
  - 유동인구: 세담터(세종시 전용 빅데이터 플랫폼, 무료) / SK 지오비전(유료, 2단계)
  - 상권: 소상공인 상가정보·배달상권 CSV (무료), 세종시 상권정보시스템 (무료)
  - **조치원 특화**: 홍익대 세종캠퍼스 학사일정 (무료, MVP 강력 권장)
  - 경제지표·검색량: 2단계 보류

### 2026-05-23 (23차)

루트의 `캡스톤_ML_통합가이드.md`를 `docs/research/ai/00_ml_reference_guide.md`로 이동. `00_` prefix로 "결정 문서가 아닌 기반 레퍼런스"임을 자연 정렬로 분리. 캡스톤 수업자료 통합본(EDA·전처리·피처 선택·AutoML·평가 시각화). `docs/README.md` §3 ai/ 표·`docs/research/README.md` ai/ 표에 인덱스 추가(연결 spec 컬럼은 "—(기반 참고)"). 사유: 일반 ML 방법론 가이드라 spec/plan 부적합, AI 도메인 한정이라 docs/ 루트보다 research/ai/ 적합.

`README.md` §5 "브랜치 전략" 섹션 신규 추가(개발 환경 규칙 4 다음). 브랜치 트리 다이어그램·머지 흐름(be+fe 통합 흐름 + AI 직행 흐름)·작업 규칙·main 보호 규칙·피처 브랜치 작업 예시 명령어 포함. 사유: GitHub 베이스 브랜치 4개(`ai`·`dev`·`be`·`fe`) 신설 및 main 보호 적용에 따른 팀 규칙 문서화. AI 서버 독립 배포 정책 명시(be+fe와는 HTTP API로만 연동, `dev`와 합치지 않음).

### 2026-05-22 (22차)

캡스톤 ML 통합가이드(`docs/research/ai/00_ml_guide_reference.md`)를 기반으로 AI research 미확정 항목 일부 확정 및 spec 정정.

**A. research/ai 업데이트**

- `01_model_selection.md`:
  - §2.2 **Regression 확정** (수량 직접 예측, 분류 방식 기각)
  - §2.1 DNN 진단 조건표 추가 (AutoGluon probe 후 결정 기준 명시)
  - §3.1 **Walk-forward CV (TimeSeriesSplit) 확정** (단일 시계열, K-fold 금지)
  - §3.2 평가 지표 3종 후보 확정: **MAE + MAPE + R²** (목표값 probe 후)
  - §3.3 **예측 근거: LightGBM `gain` + TreeSHAP 확정**
- `02_ml_pipeline_open_items.md`:
  - §3.1 결측값 보간 전략 확정 (판매량 ffill, 날씨 보간 등 컬럼별 매핑)
  - §3.2 이상치 탐지 방법론 확정: **IQR 우선, Z-score 보조** (임계 계수 probe 후)
  - §3.3 **데이터 누수 방지 원칙** 신규 추가
  - §2.0 Walk-forward CV와 슬라이딩 윈도우 연관 관계 명시

**B. spec/08_ai 정정 (HANDOFF 항목 처리)**

- `ml_pipeline.md` §3: "푸시 발송" → **"앱 내 알림"** 정정
- `ml_pipeline.md` §6: IQR·결측 전략·누수 방지 원칙 추가
- `ml_pipeline.md` §10: "n8n 대시보드" → **"`pipeline_jobs` 테이블 + Slack"** 정정
- `model_spec.md` §3: **Regression 확정** 반영
- `model_spec.md` §7: **Walk-forward CV** 반영
- `model_spec.md` §9: **TreeSHAP 채택** 반영

**C. 신규 파일**

- `docs/research/ai/00_ml_guide_reference.md` — 캡스톤 ML 통합가이드 (PART 0~5 + 부록)

### 2026-05-20 (21차)

`docs/plan/plan_gantt.md` BE/FE 작업 3개를 AI 의존성 기준으로 골격(skeleton)·hookup으로 분할. 사유: HANDOFF.md "AI 의존성" 4가지(예측 근거·정확도 지표·n8n 전처리·신뢰도 임계값) 결정이 미정이라 AI 팀 결과 받기 전엔 hookup 부분 진행 불가. 골격은 ai_api(인터페이스)만 있으면 진행 가능, hookup은 ai_model 완료 후 진행.

**A. §4 작업 목록 — 3개 작업 6개로 분할 (총 22개 → 25개)**

- `n8n_data`(5일) → `n8n_data_skeleton`(3일, 전처리 더미 노드) + `n8n_data_hookup`(2일, AI 팀 확정 규칙 반영). `n8n_run` deps 갱신
- `ord_be`(6일) → `ord_be_skeleton`(4일, 예측 수량 응답·근거 placeholder·임계값 env 자리) + `ord_be_hookup`(2일, 근거 응답 필드 형태·임계값 값 반영)
- `ord_fe`(7일) → `ord_fe_skeleton`(4일, 수량 표시·근거 영역 placeholder) + `ord_fe_hookup`(3일, 근거 UI 구현·신뢰도 배지 연결)
- `auto`·`dash` deps: `ord_be` → `ord_be_skeleton` (수량만 있으면 자동화·집계 가능)
- `test_release` deps: `ord_fe`·`n8n_run` → `ord_fe_hookup`·`n8n_data_hookup` (hookup까지 끝난 후 검증)

**B. §2 단계 개요 — Phase 12 "AI hookup" 신설, 기존 Phase 12 → Phase 13 (13 Phase → 14 Phase)**

- Phase 8 정의에 "골격" 명시 + 전처리 더미 노드 표현
- Phase 9 정의에 "골격" 명시 + 근거·임계값 placeholder 표현
- Phase 12 신설: AI hookup (n8n 전처리 실제 로직·예측 근거 응답/UI·신뢰도 임계값)
- Phase 13: 기존 통합 검증·배포

**C. §3 mermaid·핵심 포인트 갱신**

- mermaid에 HOOK 노드 추가, AIM·N8N·ORD에서 HOOK으로 합류
- 핵심 포인트: 합류 지점을 "1차 골격(인터페이스 only) + 2차 hookup(ai_model 완료 후)"으로 분리

**D. §5 검증 좌표 재계산 (전체 종료 Day 62 → Day 58, 4일 단축)**

- Phase 8 골격: 30 → 38 (n8n_data_skeleton·n8n_run)
- Phase 9 골격: 38 → 46 (ord_be_skeleton·ord_fe_skeleton)
- Phase 10·11: 42 → 49 (ord_be_skeleton 후 시작)
- Phase 12 AI hookup: 33 → 49 (n8n hookup은 Day 33부터·예측 hookup은 Day 42부터)
- Phase 13: 49 → 58

**E. §6 마일스톤 — Phase ↔ 마일스톤 1:1에서 Phase별 다수 마일스톤으로 재편 + `be/`·`fe/` 폴더 분리**

- 기존 §6 14행 통합 표 → "Phase별 파일 색인" 표로 단순화
- 마일스톤 정의 위치를 `docs/plan/be/phase_XX_*.md`·`docs/plan/fe/phase_XX_*.md`로 위임
- 마일스톤 ID 규칙 신설: BE는 `M{Phase}.B{n}`, FE는 `M{Phase}.F{n}`, 통합 종료는 `M{Phase}`
- Phase별 다수 sub-마일스톤(예: Phase 3 BE는 M3.B1~M3.B5 = AuthService·StoreService·국세청 검증·logout-all·auth_test) — 작업 ID 안의 산출물 단위 가시화
- AI 영역(Phase 6·7)은 본인 작업 아니라 폴더 파일 없음

**F. `docs/plan/be/`·`docs/plan/fe/` 폴더 신설 + Phase 파일 21개 생성**

- `be/`: phase_00_research·02_infra·03_auth·04_pos·05_domain·08_n8n·09_order·10_automation·11_dashboard·12_hookup·13_release (11개)
- `fe/`: phase_00_research·02_infra·03_auth·04_pos·05_domain·09_order·10_automation·11_dashboard·12_hookup·13_release (10개, Phase 8은 BE only)
- Phase 1(plan)은 본 plan_gantt.md 자체가 작업이라 별도 파일 없음
- 각 파일: 마일스톤 표(ID·산출물·검증) + 외부 의존 + 참조 + Phase 통합 종료 조건

### 2026-05-16~17 (20차)

14개 미확정 AI 항목을 일괄 검토하여 spec 전반의 가정·잠정값을 research로 위임. 작업 모델 단순화 위해 `docs/spec/prompts/` 폴더 두 파일(`08_ai_handoff.md`·`consistency_check.md`) 모두 폐기. 검토 항목 본 단위로 사용자가 직접 결정(AI 판단 금지·미확정+확정 사실 동시 나열·일반어 설명·단계별 진행 원칙).

**A. 외부 데이터 미확정 항목 — `[조사 중]` 인라인 표기 부착 (정책: 활용 의도 확정 / 기술 가능성 미정)**

- 경제지표·검색량·SNS 노출도·프로모션·주변 행사 정보가 등장하는 모든 위치에 `[조사 중]` 표기. 단어 삭제 대신 미확정성 가시화
- 영향: `requirements.md` §3·§5, `feature_list.md` §2.1·§수요예측, `feature_spec.md` §5.1·§5.2·§10.2 표, `sequence.md` §1·§2 mermaid, `api_spec.md` §8 JSON(`// [조사 중]` 코멘트), `model_spec.md` §5 입력 피처 표, `ml_pipeline.md` §4 외부 안내문(기존 유지)

**B. AI probe 후 확정 항목 — 잠정값 research 분리**

- 결측값 보간 방법 → `02_ml_pipeline_open_items.md` §3.1 (spec에는 "처리한다" 사실만)
- 신뢰도 낮음 임계값(MAPE 20% / 학습 30일 / 결측 30%) → `01_model_selection.md` §4.1
- MVP MAPE 30% 목표 → `01_model_selection.md` §4.2
- 이상치 탐지 방법(IQR/Z-score)·5% 임계값·"분리" 정책 → `02_ml_pipeline_open_items.md` §3.2·§3.3·§3.4
- 학습 데이터 사용 방식(슬라이딩 윈도우 적용 여부·N개월) → `02_ml_pipeline_open_items.md` §2.1·§2.2·§2.3
- spec 영향: `feature_spec.md` §5.3 임계값 표 삭제·§4.6 이상치 표 단순화·§5.5 정량 표현 추상화, `feature_list.md` 수요예측·POS 연동 항목, `mvp_scope.md` 예측 품질 기준 표 삭제·§8 각주 추상화, `requirements.md` §3 이상치 줄 추상화, `ml_pipeline.md` §6 IQR/Z-score 명시 삭제·§10 미확정 안내 분리

**C. Cold-start·재학습 후 정책 — 전략 spec 유지 / 분기·승인 research 통합**

- Cold-start 파이프라인 분기 로직 → `01_model_selection.md` §3 표 (전략·DB 매칭 필드는 `feature_spec.md` §5.4 [2단계] spec 유지)
- 재학습 후 모델 교체·배포 승인 기준 → `02_ml_pipeline_open_items.md` §6 헤더 통합 (항목 7+14 묶음)
- DNN 도입 여부 → `01_model_selection.md` §2.1 (spec "PyTorch DNN 기술 스택 포함" 단정 제거)

**D. 평가 지표 — MAPE 사용 여부 자체 research 위임**

- spec 12곳에서 "MAPE" 단어 → "예측 정확도 지표(research §3 확정)" 추상화
- 영향: `requirements.md` §5, `feature_list.md` ROI·신뢰도 행, `user_flow.md` 대시보드 차트, `api_spec.md` `/api/dashboard/roi`, `service_design.md` `get_roi`, `mvp_scope.md` ROI·예측 품질 기준, `feature_spec.md` ROI 산식 표·대시보드 차트·신뢰도 경고 사유, `feature_spec.md` §5.3 신뢰도 축 3종 추상화
- DB·API 필드명: `forecast_mape` → `forecast_accuracy_metric` (6곳, `feature_spec.md` §8.2 출력 표·`api_spec.md` `/api/dashboard/roi` 응답 4건·설명 안내문)

**E. 예측 근거 — 모델·산출 방법·출력 형태 모두 research 위임 (DB 컬럼·API 엔드포인트 삭제 포함)**

- "초기 AI 모델 = LightGBM/XGBoost" 단정 제거: `model_spec.md` §2 표·§3·§9, `ml_pipeline.md` §3·§7. 베이스라인 비교 후보 목록은 유지
- "예측 근거 = SHAP + Feature Importance" 단정 제거: `feature_list.md` §2.6·기능표, `feature_spec.md` §5·§9·§12, `requirements.md`, `usecase_spec.md`, `ml_pipeline.md` §9, `sequence.md` 2곳, `service_design.md` 라이브러리 표
- "출력 형태 = Top-3 자연어" 단정 제거: `feature_spec.md` §9.1 자연어 템플릿 코드블록 삭제, `model_spec.md` §6·§9
- **DB 컬럼 삭제**: `schema.md` `forecast_results.explanation_text`·`top_factors`
- **AI Server API 삭제**: `api_spec.md` `POST /ai/xai/shap` 엔드포인트 + 응답 예시 3곳에서 `explanation_text`·`top_factors` 필드 제거
- **AIServerClient/ForecastService 메서드 삭제**: `service_design.md` `get_shap`
- `mvp_scope.md` "XAI" 표현 4건 추상화
- 유지: 베이스라인 비교 후보 목록, `is_low_confidence`/`low_confidence_reason` 컬럼, AI Server 4개 핵심 API(`/ai/forecast/predict`·`/ai/orders/recommend`·`/ai/forecast/train`·`/ai/forecast/status`·`/ai/health`)

**F. prompts/ 폴더 두 파일 폐기 + 참조 정리**

- `08_ai_handoff.md` 폐기 (작업 모델 단순화 — research 완료 후 곧바로 08_ai spec 역반영). 참조 8건 정리(README SSOT·파일 맵 5건, consistency_check 2건, research 2건)
- `consistency_check.md` 폐기 (사용자 직접 — 점검 항목 표 유지 비용 초과). 참조 4건 정리(README SSOT 표, `사주라_기술문서.md` 2건, research 1건)
- `prompts/` 폴더 빈 상태

**G. research 파일 보강 (2개 파일)**

- `01_model_selection.md` §2 헤더 "초기 모델 선정"으로 격상 / §2.1 "DNN 도입 여부 및 LightGBM ↔ DNN 전환 기준"으로 격상 / §3 표 행 보강(평가 지표 선정·예측 근거 산출 방법 및 출력 형태·Cold-start 파이프라인 분기 로직·재학습 후 배포 승인) / §4 신뢰도 낮음 판단 기준 헤더·§4.1 잠정 임계값·§4.2 MVP MAPE 잠정 목표·§4.3 probe 후 확정 절차 신설
- `02_ml_pipeline_open_items.md` §2 "학습 데이터 사용 방식" 격상(§2.1 후보·§2.2 N 값·§2.3 spec 역반영 대상) / §3 결측·이상치 처리 기준 보강(§3.1~§3.4) / §6 "재학습 후 모델 교체·배포 승인 기준" 통합 헤더

**H. PROGRESS.md §3 정책 결정 12건 추가** (외부 데이터 분류 / 결측 보간 / 신뢰도 임계값 / 이상치 정책 / 학습 데이터 사용 방식 / Cold-start / handoff 폐기 / 재학습 교체+배포 승인 통합 / 평가 지표 / DNN 도입 / 예측 근거 / consistency_check 폐기)

### 2026-05-16 (19차)

codex 1회차 spec 교차 검증(8건) 결과를 기준으로 정책·라벨·구조 일괄 정합. CSV-only MVP 정책 확정 + MVP/2단계 배지 도입 + FE spec 폴더 신설 + 부수 불일치 정정.

**A. CSV-only MVP 정책 정합 (5건)**

- `spec/01_requirements/requirements.md` §5.1 — "CSV 임시 모드에서 예측·발주 비활성화" 문장 삭제, "CSV 모드에서도 동일하게 동작" + POS API [2단계] 라벨 추가
- `spec/01_requirements/usecase_spec.md` UC-01 §11~13 기본 흐름 + 대안 흐름 — CSV가 MVP 기본 경로, POS API [2단계]임을 명시. 비활성화 문구 삭제
- `spec/03_feature_design/feature_spec.md` §1.4 온보딩 흐름·필수 입력 표·§4.1 지원 방식·§4.2 어댑터 표·§4.3 POS API·§4.4 CSV 업로드·§5.5(구 "예외", 신 "데이터 소스별 동작")·§12.2 Step 3·§12.10 설정 — CSV 기본 경로 + POS API [2단계] + "CSV/Excel" → "CSV(UTF-8)" 단일화 정합
- `spec/04_flow/user_flow.md` §2 텍스트 다이어그램 + §3 온보딩 5단계 — 모드 선택 흐름·양쪽 모두 예측·자동발주 활성화
- `spec/04_flow/sequence.md` §2 alt 블록 — CSV 모드와 POS API 모드 분기로 재구성

**B. MVP/2단계 라벨 도입 (4건)**

- `spec/05_api/api_spec.md` §3 매장/POS API + §9 대시보드/파이프라인/데이터 API + §10 AI Server API — endpoint 표에 "단계" 컬럼 추가, ROI·POS API·data export/delete·forecast/train에 [2단계] 부여
- `spec/07_backend/service_design.md` §3 서비스 클래스 목록 + §4 PosService·DashboardService·AIServerClient + §6 호출 흐름 — 메서드 표 "단계" 컬럼 추가, POS 동기화·ROI·재학습 [2단계] 부여. CSV 업로드 흐름 1행 신규(MVP 기본 경로 명시)
- `spec/09_nonfunctional/performance.md` §2.4 배치 SLA — 주간 재학습 [2단계] 라벨
- `spec/03_feature_design/feature_spec.md` §5.4 Cold-start·§8.2 ROI·§10.2 주간 재학습 — 헤더 [2단계] + `> MVP 범위 외` 안내문

**C. 즉시 정정 (3건)**

- `spec/07_backend/service_design.md` §250 NotificationService 안내문 — "DB 직접 INSERT" 옵션 삭제, BE API 호출로 단일 경로 단언(`schema.md` §511 n8n_user 권한 회수 정합)
- `spec/09_nonfunctional/security.md` §6 결제 — PG 토큰화·자체 서버 토큰값 저장 문구 삭제, "쿠팡 직접 수행·미경유·미저장" 단언
- `docs/research/README.md` 구조 블록·frontend 표 연결 spec + `docs/research/SUMMARY.md` 상단 메타 — backend "01~14" → "01~11, 13~14" / frontend "예정" → "완료, 11 카테고리" / "01~10" → "01~11" 정정

**D. FE spec 폴더 신설**

- `docs/spec/07_frontend/frontend_design.md` 신규 — 11개 섹션(기술 스택 / 인증 통합 / 라우팅 / 상태 관리 / PWA·Web Push / API 통합 / 폼 / 에러 모니터링 / CI / 디렉토리 구조 / MVP·2단계 매핑). SUMMARY 참조 패턴으로 중복 정의 회피
- `docs/README.md` §2 spec 목록 + §5-3 연동 파일 맵 — frontend_design.md 행 신규
- `docs/research/README.md` frontend 표 연결 spec — 모두 `07_frontend/frontend_design.md` 섹션별 매핑

**E. 프로세스 보강**

- `spec/prompts/consistency_check.md` §15-1 "MVP 정책 전환 시 동시 점검 파일" 게이트 신설(7개 파일 체크리스트) + §15-2 단계 라벨링 규칙 명문화 + §16 Frontend spec 일관성 신설. 검증 대상에 `frontend_design.md` 추가

### 2026-05-16 (18차)

17차 audit 직후 spec 누락 검사로 발견된 5건(A-1~A-5) 일괄 반영. frontend research 11번째 카테고리(`11_observability.md`) 신규 추가.

**A-1. 인앱 알림 폴링 정책 변경**

- `research/frontend/02_routing_state.md` §2.6 — `usePreferencesStore`에서 `notificationPollingMs` 필드 제거. 알림 폴링 주기 사용자 설정 노출 금지 사유 명시(BE rate limit 보호 + Web Push가 즉시성 담당)
- `research/frontend/06_pwa_push.md` §3.5·§3.6 — hook을 `usePreferencesStore` 의존에서 **코드 상수 `NOTIFICATION_POLLING_MS = 5 * 60_000`** 으로 변경. 수동 "새로고침" 버튼 권장 추가. §4.1 결정 표·§6 비교 요약도 정합 갱신

**A-2. FE Sentry 정식 결정 (`11_observability.md` 신규)**

- §1 SaaS 후보 5개 — Sentry 채택 / LogRocket(세션 리플레이 PII)·Bugsnag·Rollbar(BE 분리)·자체 구축(운영 부담) 탈락
- §2 라이브러리 `@sentry/react` ^8 + `@sentry/vite-plugin` ^2 + 초기화 코드 예시
- §3 PII scrubbing 정책 — `sendDefaultPii: false` + `beforeSend`(Authorization·Cookie·이메일·전화·사업자번호 마스킹) + `beforeBreadcrumb`(token 패턴 차단·fetch 헤더 마스킹)
- §4 소스맵 업로드 정책 — `@sentry/vite-plugin` `sourcemaps.deleteFilesAfterUpload: true`로 dist 노출 차단. CI secret 4개(`SENTRY_AUTH_TOKEN`·`SENTRY_ORG`·`SENTRY_PROJECT`·`VITE_APP_VERSION`)
- §5 sampleRate — error 100% + traces 5%, Sentry 무료 5k events/월 시뮬레이션·한도 초과 시 단계적 대응(traces 0.02·노이즈 ignore·Team 결제)

**A-3. CSP `connect-src` Sentry SaaS 허용 — 3건 정합**

- `research/frontend/08_auth_security.md` §3.4 Caddy CSP 블록 + §3.4 디렉티브 표 모두 `connect-src 'self' https://*.ingest.sentry.io`로 갱신
- `research/backend/03_reverse_proxy.md` §4.1 Caddyfile + `research/backend/05_auth_security.md` §3.5 Caddy 헤더 권장값 동일 갱신

**A-4. OAuth callback 응답 방식 정정 — 3건 정합**

- `spec/05_api/api_spec.md` §2 Endpoints 표 2행 + `GET /api/auth/callback/kakao`·`GET /api/auth/callback/google` 상세 — "Response 200 JSON" → "Response 302 Redirect to FE root + Set-Cookie refresh_token (Access Token URL·body 미노출, FE 첫 진입에서 `POST /api/auth/refresh`로 동기)". 보안 사유·frontend 08 참조 명시
- `spec/04_flow/sequence.md` §2 alt 블록(기존/신규 사용자) — "Access Token 직접 응답" → "Set-Cookie + 302 Redirect → FE root → POST refresh → GET /auth/me" 흐름 추가. 단계 7개 증가
- `spec/03_feature_design/feature_spec.md` §1.1 Google·카카오 로그인 흐름 블록 + 입출력 표 — 동일 정합

**A-5. FE Sentry release tagging spec 반영**

- `spec/09_nonfunctional/performance.md` §5 모니터링 — BE Sentry 다음 줄에 FE Sentry(`@sentry/react` + `@sentry/vite-plugin`) 1행 추가. BE↔FE 동일 release(`VITE_APP_VERSION` = `git-<sha-short>`)·PII scrubbing·소스맵 정책·sampleRate 명시. 결정 근거 `frontend/11_observability.md` 참조

**상위 인덱스 갱신 (3건)**

- `docs/README.md` §3 frontend 표 + `docs/research/README.md` frontend 표 + `docs/research/frontend/README.md` — 11번째 카테고리 행 추가
- `docs/research/SUMMARY.md` — §16-1 "Frontend 에러 모니터링·관측가능성" 신규 섹션 + §19.1 BE↔FE 짝맞춤에 Sentry 행·폴링 5분 정정·인앱 폴링 정책 행 추가

### 2026-05-16 (17차)

frontend research 10개 카테고리 작성 + 결정 사항 spec·연관 backend research 반영.

**research/frontend (10개 신규 + README 재편)**

- `README.md` — 10개 카테고리 인덱스 + 결정 흐름 원칙(probe 의존 외 모두 확정·보존 후보는 정량 트리거)
- `01_framework_build.md` — React 19 ratify + Vite 6 채택(Next.js 보존) + TypeScript 5.x (strict) + tsconfig 권장값
- `02_routing_state.md` — React Router v7 + Zustand 5 (auth 메모리·preferences persist 분리)
- `03_data_http.md` — TanStack Query v5 + ky 1.x(401 단일 refresh 인터셉터) + openapi-typescript 7.x(타입만)
- `04_ui_styling.md` — Tailwind CSS v4 + shadcn/ui(Radix) + lucide-react
- `05_form_validation.md` — React Hook Form 7 + zod 3 + @hookform/resolvers/zod (BE Pydantic v2 1:1 매핑)
- `06_pwa_push.md` — vite-plugin-pwa + injectManifest(SW push/notificationclick 커스텀) + VAPID 환경변수 inline + 인앱 TanStack Query refetchInterval 30s
- `07_charts.md` — Recharts 2.x + shadcn chart 통합
- `08_auth_security.md` — OAuth BE 리다이렉트·메모리·HttpOnly Cookie + CSP 디렉티브 8개 확정 (PWA·Radix·Recharts 정합)
- `09_testing_quality.md` — Vitest 2 + @testing-library/react + MSW 2 + Playwright(Node) + Biome + tsc + Storybook 보존
- `10_deployment.md` — pnpm 9 + Node 22 LTS + Caddy 이미지 자체 빌드(FE dist COPY) + GitHub Actions 8단계 (fe workflow)

**spec 정정 (1건)**

- `spec/07_backend/service_design.md` §11.1 caddy 행 — `caddy:alpine` → **자체 빌드 (`Dockerfile.caddy` — `caddy:2-alpine` 베이스 + FE `dist/` COPY)**. 사유: FE 빌드 산출이 Caddy 이미지에 포함되어야 atomic 배포·롤백 가능. 호스트 volume·별도 컨테이너 대안 탈락 (`10_deployment.md` §3.3).

**backend research 정합 갱신 (2건)**

- `research/backend/03_reverse_proxy.md` §4.1 Caddyfile CSP 블록 — frontend 08 §3.4 결정값으로 정합 (`worker-src 'self'`·`manifest-src 'self'`·`upgrade-insecure-requests` 추가, `img-src https:` 제거 후 `blob:` 추가, Permissions-Policy 순서 정정)
- `research/backend/05_auth_security.md` §3.5 Caddy 보안 헤더 권장값 — 동일 CSP로 정합 + 디렉티브 상세 근거 frontend 08로 위임 명시

**상위 인덱스 갱신 (2건)**

- `docs/README.md` §3 frontend/ 표 — 10개 파일 목록으로 재편
- `docs/research/README.md` frontend/ 표 — 10개 파일 + 연결 spec 명시

**보존 후보 정량 트리거 11개**

| 보존 | 트리거 (요약) |
|------|---|
| Next.js | SEO/마케팅 페이지·번들 1MB+·매장 1000+ |
| TanStack Router | 라우트 50+·params 타입 버그 분기 3건+·search params 스키마 5개+ |
| Jotai | 전역 상태 20+·Zustand selector 한계 화면 5개+ |
| axios | 업로드 진행률 화면 3개+·ky 표현 불가 시나리오 2건+·ky 유지보수 정체 |
| openapi-fetch | path 입력 오타 분기 3건+ |
| valibot | 스키마 30+·zod 번들 상위 5위 |
| Mantine | shadcn 컴포넌트 직접 스타일링 비용 20개+ |
| Chart.js | 단일 차트 데이터 1000+·SVG 60fps 미만·인터랙션 화면 2개+ |
| ESLint+Prettier | Biome 미지원 규칙 3건+·핵심 플러그인 미지원·유지보수 정체 |
| Storybook | 사주라 도메인 컴포넌트 30+·디자이너 정기 리뷰·시각 회귀 5개+ |
| npm | pnpm 호환 문제 1건+ |
| CSP nonce | inline script 라이브러리 도입·3rd-party 분석 도입·보안 감사 권고 |

### 2026-05-16 (16차)

backend research(01~14, 12 제외) ↔ spec 전체 정합 검증 + 발견된 불일치·누락 일괄 정정. Plan 단계 진입 전 마지막 종합 검증.

**검증 결과**
- ✅ 라이브러리 매핑 54개 모두 spec service_design.md §1 반영
- ✅ security·schema·api_spec·feature_spec·erd 정합 확인
- ⚠️ 5건 불일치·누락 발견 → 일괄 수정 (N1~N5)
- ⚠️ 책임 분리 위반 발견 (n8n에 소비기한 cron 위임) → 정정

**책임 분리 정정 (9개 위치)**

소비기한 체크는 재고 도메인 비즈니스 로직 — n8n(AI 워크플로우 도구) 책임 영역 아님. ARQ cron_jobs로 BE 내부 처리하는 패턴으로 정정.

- `spec/07_backend/service_design.md` §1 ARQ 행: "잡 큐 + cron_jobs" 명시 (BE 도메인 cron 통합)
- `spec/07_backend/service_design.md` §4 InventoryService: `check_expiry_batch` 메서드 신규 (ARQ cron 진입점)
- `research/backend/08_async_pipeline.md` §1.4: 스케줄러 결정 정정 — "n8n=AI / ARQ=BE 도메인" 책임 분리 원칙 명시
- `research/backend/08_async_pipeline.md` §4.1: 소비기한 흐름 전면 갱신 (BE ARQ cron 패턴)
- `research/backend/06_external_integration.md` §3.5: 알림 발송 표 6행 전면 갱신 — "BE NotificationService 일관 처리" 원칙 + 점주(인앱·푸시)/개발팀(Slack) 책임 분리
- `spec/03_feature_design/feature_spec.md` §3.6: 실행 흐름 3단계 갱신 (ARQ cron → InventoryService → NotificationService)
- `spec/06_database/schema.md` §5 n8n_user: `notifications` SELECT/INSERT 권한 회수 + 회수 사유
- `spec/04_flow/sequence.md` §5: 야간 배치 종료 시 BE NotificationService 호출 명시 (Slack은 n8n 직접)
- `spec/04_flow/sequence.md` §7: 소비기한 시퀀스 전면 갱신 (BE ARQ cron 단독 흐름, n8n 제거)

**누락 spec 반영 (N3·N4·N5)**

- `spec/07_backend/service_design.md` §10 미들웨어 구성 신규: 등록 순서 5단계 / CORS 정책 / TrustedHost 정책 / Rate Limit 4개 endpoint (09 §3.4·§5.4·§5.5 결정 반영)
- `spec/07_backend/service_design.md` §11 운영 토폴로지 신규: Compose 6 서비스 / 환경 분리(dev/staging/prod) / CI 파이프라인 8단계 / 이미지 태그 정책 (10 §4 결정 반영)
- `spec/09_nonfunctional/performance.md` §1.3 운영 환경 메모리 권장 신규: Docker Desktop 10~12 GB · MySQL `innodb_buffer_pool_size=2G` · 컨테이너별 RSS 예상값 (10 §4.5 결정 반영)

### 2026-05-16 (15차)

보안 정책 미확정 항목 정리 + spec 반영.

**research/backend/14_security_open_items.md (전면 재편)**
- §0 처리 결과 요약 표 — 종결 4건 / 결정 2건 / 보류 3건
- §1 개인정보 수집: spec §3.1 충분 — 종결
- §2 RBAC: MVP 단일 역할 점주 종결 (옵션 A). 2단계 매트릭스는 그때 설계
- §3 감사 로그: 보관 1년 / `ops_readonly` 조회 / DB append-only + 백업 결정 → spec §5.3 반영
- §4 AES-256 적용 대상: 현 상태 유지 (`pos_connections.api_key`·`refresh_tokens.token_hash`)
- §4-A 쿠팡 자격증명: **(E) 점주 브라우저 게스트 장바구니 → (C) 세션 쿠키 → 재논의 단계적 fallback**. 외부 probe(쿠팡 동작) 검증까지 보류. 현 단계 spec 영향 없음
- §5 외부 API scope·rate limit: POS(13 2단계)·공공 API(AI 영역) 의존 보류. 자체 throttling은 09 fastapi-limiter ratify
- §6.1 다중 디바이스: 각 디바이스 자체 토큰 자연 동작 명시 → spec §2.3 반영
- §6.2 강제 로그아웃: 옵션 A 채택 → spec 신규 endpoint·메서드
- §7 OrderApprovalLog: 종결
- §8 결정 후 본 문서 위치 명시 (외부 probe 의존 항목만 잔존)

**spec/09_nonfunctional/security.md §2.3 토큰 정책**
- "다중 디바이스 로그인" 절 추가 (각 디바이스 자체 토큰)
- "강제 로그아웃 (모든 디바이스)" 절 추가 (`POST /api/auth/logout-all`)

**spec/09_nonfunctional/security.md §5.3 감사 로그**
- "보관·조회·무결성 정책" 표 추가 (보관 1년·조회 `ops_readonly` VPN·DB append-only + 백업·매월 archive 배치)

**spec/05_api/api_spec.md §2 인증 API**
- Endpoints 표에 `POST /api/auth/logout-all` 행 추가
- 신규 endpoint 상세 명세 추가 (security.md §2.3 참조)

**spec/07_backend/service_design.md §4 AuthService**
- `logout_all(user_id)` 메서드 추가

### 2026-05-16 (14차)

`docs/research/backend/12_stack_summary.md` **삭제** + `13_pos_adapter.md` 2단계 진입 가이드로 재편.

**12 삭제 사유**
- 12의 모든 내용이 다른 문서에 source-of-truth로 존재 (영역별 스택 → `service_design.md` §1, 보존 트리거 → 각 카테고리 research §x.5, spec 반영 위치 → `docs/README.md` §5-3, 정량 운영값 → 각 spec 파일).
- 메타 인덱스 역할은 `docs/research/README.md`가 이미 수행.
- "research에 spec 확정 사실을 다시 적지 않는다" 원칙(`docs/README.md` §5-1) 위반.

**12 처리**
- 파일 삭제
- `docs/README.md` §3 backend 표에서 12 행 제거
- `docs/research/README.md` backend 표에서 12 행 제거

**13_pos_adapter.md 재편**
- `mvp_scope.md` §4에서 POS API 연동은 2단계 분류 — MVP 범위 외. 본 audit 단계 결정 불가능 (외부 POS사 영업·자격증명·API 문서 확보 = probe 의존).
- 문서를 "2단계 진입 가이드"로 명확히 재정리.
  - §0 MVP 범위와 본 문서의 위치 (외부 probe 의존 명시)
  - §1 지원 대상 POS사 ratify (어댑터 클래스 매핑)
  - §2 2단계 진입 시 조사 체크리스트 — 인증/자격증명·데이터 수집·공통 스키마 매핑·운영 고려 4개 영역
  - §3 확정 절차 5단계 — 외부 정보 확보 → schema 영향 → 어댑터 인터페이스 → 동작 명세 → 테스트 전략
  - §4 본 문서 갱신 시점 (MVP 중 갱신 안 함, 2단계 진입·POS API 변경 시 갱신)
- 본 단계에서는 spec 영향 없음 — 2단계 진입 시 spec(schema·feature_spec·service_design) 갱신 절차만 정의.

### 2026-05-16 (13차)

DI·유틸·결제·개발 편의 리서치 완료 + spec 반영.

**research/backend/11_misc.md (전면 재편)**
- §0 카테고리 구성 + ratify 6개 + 신규 결정 3개 + 보존 6개 매핑
- §1 DI / 도메인(4 후보): FastAPI Depends + Pydantic DTO ratify. Dependency Injector 보존, Punq/Lagom 탈락
- §2 ID / 시간 / 검증(6 후보): UUIDv4 + datetime+zoneinfo ratify. phonenumbers 신규 채택. ULID 보존(대량 INSERT 페이지 분할 트리거 3지표). nanoid/pendulum/arrow/babel 탈락
- §3 결제(3 후보): 쿠팡 Playwright ratify. PG사 SDK / Stripe 보존 (자체 결제·해외 확장 시)
- §4 개발 편의(6 후보): uvicorn --reload ratify. ipython + rich 신규 채택. httpie/Bruno/DBeaver/mycli/n8n Desktop은 개발자 개인 선택으로 spec 미명시
- §5 통합 결정 + §6 후보 세부 + §7 비교 요약

**spec/07_backend/service_design.md**
- §1 운영 라이브러리에 phonenumbers 1행 추가
- §1 개발·테스트 도구에 ipython + rich 2행 추가

**spec/06_database/schema.md §3.3 stores**
- `phone` 컬럼 COMMENT 추가 — "NATIONAL 형식 010-1234-5678 — BE가 phonenumbers로 정규화 후 저장"

### 2026-05-16 (12차)

의존성·컨테이너·배포·CI 리서치 완료 + spec 반영.

**research/backend/10_deployment.md (전면 재편)**
- §0 카테고리 구성 + 결정 도구·이미 결정된 항목·보존 후보 매핑
- §1 의존성 관리(6 후보): uv 채택. Poetry/pip/PDM/pip-tools/Hatch 탈락
- §2 컨테이너·배포·CI(12 후보): Docker + Docker Compose(V2) + Buildx + GitHub Actions + Trivy 채택. Grype/Watchtower 탈락. Nginx/Caddy/Traefik는 03 결정. Kubernetes/Helm/ArgoCD/Flux 보존(매장 1000+ 트리거)
- §3 환경·시크릿·설정(4 후보): 모두 04·05에서 결정 — 본 카테고리 신규 결정 없음
- §4 운영 흐름: Docker Compose 6 서비스 구성·환경 분리(dev/staging/prod)·CI 8단계 파이프라인·이미지 태그 정책(`git-<commit-sha-short>`)·Docker Desktop 메모리 10~12GB
- §5 통합 결정 + §6 후보 세부 + §7 비교 요약

**spec/07_backend/service_design.md**
- §1 외부 운영 도구 표에 Docker · Docker Compose · GitHub Actions 3개 행 추가
- §1 개발·테스트 도구 표에 uv · Trivy 2개 행 추가

### 2026-05-16 (11차)

테스트·코드 품질·미들웨어·API 문서화 리서치 완료 + spec 반영.

**research/backend/09_testing_quality.md (전면 재편)**
- §0 카테고리 구성 + 결정 라이브러리·이미 결정된 항목·보존 후보 매핑
- §1 테스트(12 후보): pytest + 6개 채택. Pact/Schemathesis/pytest-playwright/Locust·k6 보존 (probe·요구 트리거)
- §2 코드 품질·정적 분석(8 후보): ruff + mypy + bandit + pip-audit + pre-commit 채택. black·isort·safety 탈락. pyright 보존
- §3 미들웨어(8 후보): CORSMiddleware + TrustedHostMiddleware + fastapi-limiter 채택. asgi-correlation-id는 07에서 ratify. slowapi/starlette-context/GZip·Brotli/HTTPSRedirect/secure 탈락 (Caddy 처리 또는 대체)
- §4 API 문서화(4 후보): Swagger UI + ReDoc 내장 채택. Stoplight/RapiDoc/Postman 미채택
- §5 운영 흐름: 테스트 전략(단위/통합/외부 mock), 커버리지 목표, CI 파이프라인 요약, 미들웨어 순서, Rate Limit 정책 5개 endpoint
- §6 통합 결정 + §7 후보 세부 + §8 비교 요약

**spec/07_backend/service_design.md**
- §1 운영 라이브러리에 fastapi-limiter 추가
- §1 신규 표 "개발·테스트 도구" 추가 — 12개 도구 (pytest 7개 + 정적 분석 5개)

### 2026-05-16 (10차)

비동기 작업·데이터 파이프라인 리서치 완료 + spec 반영. AI 연관 항목(데이터 품질 검증)은 보류 표시로 분리.

**research/backend/08_async_pipeline.md (전면 재편)**
- §0 카테고리 구성 + 결정 라이브러리·운영 흐름 매핑 + AI 영역 보류 명시
- §1 백그라운드 작업·잡 큐·스케줄러(7 후보): FastAPI BackgroundTasks + ARQ 채택. Taskiq/Dramatiq/Celery/RQ 탈락. APScheduler 미채택 — n8n으로 스케줄 통합
- §1.5 BackgroundTasks vs ARQ 사용 구분 표 (5개 작업 매핑)
- §2 데이터 파이프라인 오케스트레이션(4 후보): n8n ratify. Airflow/Prefect/Dagster 탈락
- §3 데이터 품질 검증(2 후보 Great Expectations·Pandera) — **AI 영역 결정 후 작업**으로 보류. 보류 종료 조건 명시 (ml_pipeline.md 결측·이상치 처리 기준 확정 시)
- §4 운영 흐름: 소비기한 일일 알림 배치 n8n 매일 02:00 + ARQ 잡 큐 인프라(Redis·별도 워커 컨테이너·재시도 정책) + BackgroundTasks 사용 범위
- §5 통합 결정 + §6 후보 세부 + §7 비교 요약 표

**spec/07_backend/service_design.md §1**
- 1개 행 추가: ARQ (Redis 기반 async 잡 큐, BE Gunicorn 컨테이너와 별도 워커 컨테이너)

**spec/03_feature_design/feature_spec.md §3.6 소비기한 관리**
- 실행 주체 명시 (n8n 별도 워크플로우, 매일 02:00 — FORECAST 야간 배치와 분리)
- 실행 흐름 3단계 표 추가 (로트 조회 → notifications INSERT → Web Push 발송)
- 입력 항목에서 "야간 배치에서 자동 조회" 잉여 표현 정리

**보류 항목 (AI 영역 확정 후 진행)**
- 데이터 품질 검증 도구 결정 (Great Expectations / Pandera / 미채택)
- 보류 종료 조건: `docs/spec/08_ai/ml_pipeline.md` 및 `docs/research/ai/02_ml_pipeline_open_items.md`의 결측·이상치 처리 기준 확정 시

### 2026-05-16 (9차)

캐시·로깅·모니터링 리서치 완료 + spec 반영.

**research/backend/07_cache_observability.md (전면 재편)**
- §0 카테고리 구성 + 결정 라이브러리·운영 흐름 매핑
- §1 캐시(7 후보): Redis + redis-py(async) 채택. Dragonfly/KeyDB 탈락, Valkey 보존(라이선스 트리거 3지표). aiocache/fastapi-cache2 탈락 — spec §9 명시 키 패턴과 추상화 충돌
- §2 로깅·모니터링·에러추적(10 후보): structlog + asgi-correlation-id + sentry-sdk[fastapi] 채택. loguru/python-json-logger 탈락. Prometheus·OpenTelemetry 보존(매장 300+·노드 2+ 트리거). Grafana/Loki/Datadog 탈락
- §3 운영 흐름: 캐시 호출 방식(명시 키 직접 호출)·로그 필수 필드 8개·Sentry 환경 분리 (PII scrubbing, `traces_sample_rate=0.1` prod) 정의
- §4 통합 결정 — 라이브러리만 정의, DB·API·서비스 정의는 spec 참조 (영역 원칙 준수)
- §5 후보 세부 정보 / §6 비교 요약 표

**spec/07_backend/service_design.md §1**
- 4개 행 추가: redis-py(async) · structlog · asgi-correlation-id · sentry-sdk[fastapi]
- Redis 행에 "캐시 패턴은 §9 참조" 명시

**spec/09_nonfunctional/performance.md §5**
- 모니터링 위임 → 결정 사항 반영: structlog + asgi-correlation-id 로깅, Sentry SDK 에러·성능, Prometheus/OpenTelemetry MVP 미채택 트리거 명시
- 로그 필수 필드 10개 명시 (ts/level/event/request_id/user_id/store_id/path/method/status/duration_ms)

### 2026-05-15 (8차)

외부 연동 리서치 완료 + spec 광범위 갱신 (Plan A: research 결정 + schema/api/service 동시 보완).

**research/backend/06_external_integration.md (전면 재편)**
- §0 카테고리 구성 + 결정 라이브러리 목록·spec 반영 위치 매핑
- §1 HTTP 클라이언트(6 후보): httpx + tenacity + aiobreaker 채택. aiohttp/requests/backoff 탈락
- §2 브라우저 자동화(8 후보): Playwright(Chromium 단일) + BeautifulSoup4(lxml) 채택. Selenium/Pyppeteer/봇 우회 도구/Scrapy 탈락. browserless 보존(BE 이미지 크기 트리거)
- §3 알림(8 후보): slack_sdk + pywebpush + fastapi-mail + 인앱(DB+polling) 채택. slack-bolt/FCM/OneSignal/SendGrid 탈락. 카카오 알림톡 보존(Web Push 도달율 트리거)
- §3.5 알림 발송 흐름 6개 상황별 주체·처리 매핑 정리
- §4 통합 결정 — research는 라이브러리 결정·운영 흐름만 정의. DB 스키마·API 계약·서비스 시그니처는 spec이 source-of-truth임을 명시하고 참조 위치만 표기 (영역 위반 정정: CREATE TABLE / endpoint 정의를 spec으로 이관)
- §5 후보 세부 정보 / §6 비교 요약 표

**spec/07_backend/service_design.md**
- §1 신규 라이브러리 6개 추가: tenacity · aiobreaker · BeautifulSoup4(lxml) · slack_sdk · pywebpush · fastapi-mail
- §1 httpx 역할 확장 (AI Server·국세청·외부 공공 API 통합 + sync 스크립트는 `httpx.Client`)
- §3 서비스 클래스 목록에 `NotificationService` 추가
- §4 NotificationService 메서드 7개 정의 (subscribe / unsubscribe / list / mark_read / mark_all_read / create_and_push / send_slack_failure)

**spec/06_database/schema.md**
- §3.22 `notifications` 신규 (인앱 알림 저장, type ENUM 6종·priority ENUM 3종·읽음 인덱스)
- §3.23 `push_subscriptions` 신규 (VAPID Web Push 구독, endpoint UNIQUE)
- §4 인덱스 설계 요약 2행 추가
- §5 n8n_user 권한에 `notifications` SELECT/INSERT 추가 (FORECAST 9단계 알림 발송 권한)

**spec/06_database/erd.md**
- §1 도메인 표에 "알림" 도메인 추가 — 총 21개 → 23개 테이블
- §2 Mermaid 다이어그램에 stores→notifications(1:N), users→notifications(1:N), users→push_subscriptions(1:N) 관계 추가
- §3 관계 구조 텍스트 동기화

**spec/05_api/api_spec.md**
- §10 알림 API 신규 섹션 추가 (5개 endpoint): POST /subscribe, DELETE /subscribe/{id}, GET /notifications, PATCH /{id}/read, PATCH /read-all
- 기존 §10(인터페이스 표준) → §11로 이동

### 2026-05-15 (7차)

spec 전체 최종 검증 (08_ai 제외) — Plan 단계 진입 전 미결 표현·일정 언급·일관성 정리.

**A. 미결 표현 제거 (7건)**
- `requirements.md` §79 "구체적 구현 방식은 확실하지 않음" (소비기한) → `feature_spec.md` §5 정합 표현으로 정정
- `requirements.md` §164 "추천 사이트 종류·API 명세는 정보 부족" → "쿠팡 단일 사이트로 한정 (`feature_spec.md` §9)"
- `requirements.md` §165 "공급업체 평가 로직 책임 주체는 확실하지 않음" → "공급업체 평가 기능은 사주라 범위 외 (`mvp_scope.md` §4)"
- `requirements.md` §166 "점주 승인 후 자동 발주 트리거 주체는 확실하지 않음" → "점주 명시 트리거 (`feature_spec.md` §9, `service_design.md` §6)"
- `feature_list.md` §2.4 "구체적 구현 방식은 확실하지 않음" → "D-3·D-1·초과 단계별 알림 (`feature_spec.md` §5)"
- `feature_list.md` "## 추가 작업 필요 항목 — API endpoint 정의 필요" 섹션 제거 (05_api 작성 완료)
- `feature_list.md` "POS사별 자격증명 형식은 추후 정의" → "`research/backend/13_pos_adapter.md`에서 조사·정의"

**B. 일정 언급 정리 (3건)**
- `service_design.md` §DataService / `api_spec.md` §GET /api/data/export, §DELETE /api/data — "MVP 제외 — 2단계 구현 예정" → "MVP 범위 외 (`mvp_scope.md` §4 참조)" (일정 표현 제거, 스코프 표시만 유지)

**C. 일관성 불일치 수정 (3건)**
- TLS 버전 — `requirements.md` §124 "TLS 1.2 이상" vs `security.md` §4 "TLS 1.3" → `requirements.md`를 TLS 1.3으로 통일 (research/03 정합)
- OAuth 외부 자격증명 표현 — `requirements.md` §122 "OAuth 외부 자격증명 등 AES-256 저장" → 사주라 schema는 외부 OAuth 토큰 미저장(auth_provider+social_id만). 워딩을 "POS API 키 등 외부 서비스 자격증명"으로 정정 + OAuth 외부 token 미저장 명시
- AES-256 mode 통일 — `service_design.md` §1만 "AES-256-GCM" 명시였음. `requirements.md` §122 / `schema.md` §473 / `security.md` §90·§122 모두 "AES-256-GCM"으로 통일

**D. 추가 발견 (2건)**
- `performance.md` §4 "구체적 인덱스 및 파티셔닝 기준은 정보 부족" → 인덱스는 `schema.md` §4에서 정의됨을 명시. 파티셔닝은 MVP 50매장 규모에서 불필요 + 매장 수 증가 시 적용 검토로 정정
- `performance.md` §5 "Sentry 등 에러 모니터링 도구 연동이 개선 방향으로 제시", "핵심 지표 대시보드 구축이 필요" → 도구·대시보드 결정을 `docs/research/backend/07_cache_observability.md`로 위임 명시

### 2026-05-15 (6차)

backend 01~05 research 최종 검증 — 미결 표현 제거 + spec 의존 워딩을 research 자체 근거로 재작성. research가 spec의 source-of-truth임을 일관되게 적용.

**원칙**
- Plan 단계 진입 전 마지막 검증으로, 실제 probe 데이터로만 알 수 있는 항목(운영 후 RPS·p95·메모리 등) 외에는 **모든 결정을 확정**한다.
- 보존 후보는 probe-dependent 재평가 트리거 형태로만 유지. "후속 작업으로 보류" "확정 후 추가" 류 표현 제거.
- research가 결정한 사실을 spec에 반영하는 구조 — "spec 확정"을 결정 근거로 사용하는 순환 논증 제거.

**01_web_framework.md**
- §3 "옵션 B 실측 보류" 표현 제거. 본 research는 외부 벤치마크 자료로 평가가 완결되며 실측은 구현 후 부하 테스트 항목임을 명시.
- §3.2.1 R22 수치 워닝 정리: 절대값 정확성이 결정에 영향 없음(§3.3에서 4개 모두 SLA 충족)을 명시.
- §1 후보 목록의 "spec 표기" 컬럼 제거 (research 자체 평가).
- §3.5 통과 후보 표·§4 결정 사유 표의 "spec 확정·spec 표기·spec 호환" 표현 자체 근거로 재작성.
- §2.4·§5.2 Litestar 단점 "spec 확정 변경 부담" → "채택률 낮음 → 1인 운영 디버깅 자료 확보 어려움".

**02_app_server.md**
- 점검 결과 spec 의존 워딩 없음. 양호.

**03_reverse_proxy.md**
- §4.1 Caddyfile "CSP는 PWA 자산 경로 확정 후 추가" 미정 제거. PWA가 같은 도메인 자산 + BE 단일 origin 호출(OAuth redirect도 BE 경유, Frontend 직접 외부 호출 없음) → 'self' 기반 CSP 결정·반영.

**04_data_layer.md**
- §1.4 최종 선발 비고 "spec 확정·spec 확정"을 §1.2 1차 벤치 결과 기반 자체 근거로 재작성.
- §4 통합 결정 "이미 spec 확정된 항목" 표현 → "FastAPI는 본 카테고리 결정 대상 아님 — `01_web_framework.md` §4 결정"으로 정리.

**05_auth_security.md**
- §0 "spec 사전 확정 라이브러리 (변경 없음)" 표 → "본 research가 결정한 라이브러리 (spec 반영)" 표로 재작성. 결정 근거 위치(§1.2 / §2.2 / §3 등)와 spec 반영 위치 명시.
- §1.2 JWT 채점표 "spec 흐름 정합 (◎ spec 확정)" → "Refresh Rotation 패턴 적합 (◎ claim·exp·iss 모두 표준)"으로 자체 근거화.
- §1.4 최종 선발 비고 "spec 확정 유지" → "JWS·JWE·JWK·JWT 모두 지원·Refresh Rotation의 claim·exp·iss·jti 표준 처리"로 재작성.
- §3.5 Caddy 보안 헤더 CSP 미정 제거. 03과 동일 CSP 블록으로 결정.
- §4 통합 결정 "이미 spec 확정된 항목" 표현 → "동일 결정으로 spec 반영되어 있어 행 추가 없음 + 정합" 으로 정리.
- §5.9·§6 비교 요약표 "spec 확정" 컬럼 자체 근거로 재작성.

**PROGRESS.md §3 결정 이력**
- FastAPI 결정 이력 신규 추가 (01 research가 ratify한 결정).

### 2026-05-15 (5차)

인증·암호화·시크릿·보안 부가 리서치 완료 + spec 반영 (Plan A 벤치마크 구조 재편).

**research/backend/05_auth_security.md (전면 재편)**
- §0 카테고리 구성 + spec 매핑(security.md 사전 확정 + 신규 반영) 신규
- §1 인증(11개 후보): OAuth/JWT/해싱 각 1차 벤치마크 → 최종 3개(Authlib, python-jose, passlib[bcrypt]) + 보존 2개(PyJWT, argon2-cffi)
- §2 암호화·시크릿(7개 후보): 대칭 암호/시크릿 로딩/시크릿 매니저 각 평가 → cryptography 신규 채택 + Vault 보존(300매장+ 트리거)
- §3 보안 부가(5개 후보): pip-audit(09에 위임), Caddy `header` 디렉티브로 보안 헤더 처리, RBAC 엔진 미채택(단일 역할)
- §3.5 Caddy 보안 헤더 권장 블록 정의 (HSTS·X-Frame·X-Content-Type·Referrer-Policy·Permissions-Policy)
- §4 통합 최종 결정: cryptography만 신규 spec 반영
- §5 후보 세부 / §6 비교 요약 표

**spec/07_backend/service_design.md §1**
- 1개 행 추가: cryptography

**research/backend/03_reverse_proxy.md §4.1 Caddyfile 예시**
- 보안 헤더 블록 추가(HSTS·X-Frame-Options·X-Content-Type-Options·Referrer-Policy·Permissions-Policy). CSP는 PWA 자산 경로 확정 후 추가.

### 2026-05-15 (4차)

데이터 계층 리서치 완료 + spec 반영 (Plan A 벤치마크 구조 재편).

**research/backend/04_data_layer.md (전면 재편)**
- §0 카테고리 구성 (3개 하위 카테고리·후보 22개 요약) 신규
- §1 ORM·드라이버·마이그레이션: 9개 후보 → 1차 벤치마크(async·MySQL·복합 JOIN·스키마 진화·FastAPI 통합) → 최종 4개(SQLAlchemy 2.x async, aiomysql, PyMySQL, Alembic), 보존 1개(asyncmy 재평가 트리거 3지표)
- §2 검증·직렬화: 6개 후보 → 최종 4개(Pydantic v2, pydantic-settings, orjson, python-multipart). msgspec·jsonschema 탈락 사유 명시
- §3 데이터 처리: 7개 후보 → 최종 2개(pandas, numpy) + 표준 datetime+zoneinfo. CSV 가정 9000건/1MB로 정량 산정, polars 보존 + 재평가 트리거 3지표
- §4 통합 최종 결정: spec 반영용 7개 신규 라이브러리 표
- §5 후보 세부 정보 / §6 비교 요약 표 갱신

**spec/07_backend/service_design.md §1**
- 7개 행 추가: PyMySQL · Pydantic v2 · pydantic-settings · orjson · python-multipart · pandas · numpy

### 2026-05-15 (3차)

리버스 프록시 리서치 완료 + spec 반영 + TLS 정책 정합 수정.

**불일치 수정 (security.md ↔ 03_reverse_proxy.md TLS 버전)**
- `security.md` §4 정책 "TLS 1.3 적용" vs `03_reverse_proxy.md` §4.1 "TLS 1.2+(기본)" 충돌 → 03을 **TLS 1.3 강제**(`tls { protocols tls1.3 }`)로 강화. Caddyfile 예시에도 반영.
- `security.md` §4에 "TLS 종료는 Caddy v2 엣지에서 수행, 내부 BE upstream은 HTTP/1.1 평문" 한 줄 추가 (구성 상세는 service_design.md/research 참조).

**research/backend/03_reverse_proxy.md**
- §2 1차 벤치마크 신규: 12개 후보 → 5개 통과 (HAProxy/Envoy/Pingora/Varnish/Kong/APISIX/Tyk 탈락)
- §3 2차 벤치마크 신규: 5개 → 1개 통과. 사유 — HTTPS 자동화 부재(Nginx/Apache/OpenResty), Docker 라벨 자동의 이점 작음(Traefik)
- §4 최종 선발 신규: **Caddy v2** 확정
- §4.1 운영 옵션 권장값: Caddyfile + transport 옵션(`keepalive 5s` `read/write_timeout 65s`) + 본문 10MB + zstd/gzip + HTTP/3
- §4.2 ipTIME DDNS + Let's Encrypt 운영 주의: 포트 포워딩(80/443 TCP·UDP) + 인증서 영속화(volume) + staging API
- §4.3 Nginx 재평가 트리거: CPU 50%·캐시 hit 80%·TLS p95 100ms
- §6 비교표: Caddy 행 "가설" → "§4 확정" 갱신

**spec/07_backend/service_design.md §1**
- Caddy v2 행 추가. 상세는 research 참조.

### 2026-05-15 (2차)

애플리케이션 서버 리서치 완료 + spec 반영.

**research/backend/02_app_server.md**
- §4 결정 사유 표의 사실 오류 수정: "spec에 Uvicorn만 명시" → "FastAPI 확정·Uvicorn 미기재"
- §4.1 워커 수 산정 신규: I/O bound 진단 + Mac mini M2 Pro 16GB 메모리 예산 + 워커당 RSS + MVP 4 / 2단계 6 / 3단계 분리 권장
- §4.2 Granian 재평가 트리거 신규: RPS·p95·CPU·메모리 압박 4지표 정량 임계치
- §4.3 운영 옵션 권장값 신규: `--timeout 60`·`--graceful-timeout 30`·`--keepalive 5`·`--max-requests 1000`·`--max-requests-jitter 50`·`--preload` + fork-unsafe 리소스 표

**spec/07_backend/service_design.md §1**
- Uvicorn(개발), Gunicorn + uvicorn.workers(운영) 행 추가 + 옵션 요약. 상세는 research 참조.

### 2026-05-15

문서 구조 재편 — 폴더 역할 명문화 + spec 비-spec 항목 research 이관 + backend_research.md 분할.

**docs/README.md**
- 폴더 역할 정의(spec/research/plan) 명문화 (§1-1)
- research/ 하위 구조(backend/frontend/ai) 도입 (§1, §3)
- spec/ · research/ · plan/ 파일 목록 갱신
- 작성 규칙(§5-1)에 "spec 금지 표현"·"plan 금지 표현" 명시

**spec → research 이동**
- `spec/08_ai/model_spec.md`: §2 "검토 예정" 행, §3 "확실하지 않음" 2줄, "추가 작업 필요 항목" 섹션 → `research/ai/01_model_selection.md`로 이동, 본문에 참조 링크만 남김
- `spec/08_ai/ml_pipeline.md`: §4 "미정" 데이터 3행, "추가 작업 필요 항목" 섹션 → `research/ai/02_ml_pipeline_open_items.md`로 이동
- `spec/09_nonfunctional/security.md`: "추가 작업 필요 항목" 섹션 → `research/backend/14_security_open_items.md`로 이동
- `spec/03_feature_design/feature_spec.md`: §4.3 POS 자격증명 미정 메모, 727행 "추가 작업" 1줄 → `research/backend/13_pos_adapter.md`로 이동

**research 분할**
- 기존 `research/backend_research.md`(2187줄, 28개 카테고리)를 `research/backend/` 12개 파일로 분할:
  - `01_web_framework.md` / `02_app_server.md` / `03_reverse_proxy.md` (구 §1.1~§1.3)
  - `04_data_layer.md` (구 §2, §3, §9)
  - `05_auth_security.md` (구 §4, §5, §24)
  - `06_external_integration.md` (구 §6, §8, §11)
  - `07_cache_observability.md` (구 §7, §12)
  - `08_async_pipeline.md` (구 §10, §23)
  - `09_testing_quality.md` (구 §13, §14, §18, §19)
  - `10_deployment.md` (구 §15~§17)
  - `11_misc.md` (구 §20~§22, §25)
  - `12_stack_summary.md` (구 §26~§28)
- 신규 파일: `research/backend/13_pos_adapter.md`, `research/backend/14_security_open_items.md`
- 신규 파일: `research/ai/01_model_selection.md`, `research/ai/02_ml_pipeline_open_items.md`
- 인덱스: `research/README.md` 신규 작성, `research/frontend/README.md` 조사 예정 카테고리 placeholder
- 원본 `research/backend_research.md` 삭제

**research/backend 헤더 재번호**
- 분할 시 원본 §1.1~§28의 헤더가 그대로 들어와 파일별로 `## 2.`, `## 3.`, `## 9.`가 혼재하던 문제 해결
- 각 파일은 자체 H1 + 순차 `## 1.`, `## 2.`, ... 로 재번호
- `### N.M` 하위도 일관 갱신, `#### N.x 비교` 헤더는 `### N.x 비교`로 승격
- "(3.2와 중복)" / "(14.7 중복 참고)" 등 옛 번호 주석을 새 파일 경로 참조로 교체
- `12_stack_summary.md`의 "본 문서 항목" 컬럼 전체를 파일 경로 + 새 섹션 번호로 재작성
- 01_web_framework.md / 02_app_server.md 본문에 남은 `1.1.2.3`, `1.1.3`, `1.2.1.3` 등 옛 번호 참조 수정

**spec 폴더 읽기 순서 재정렬 (A안: contract-first / outside-in)**
- 폴더 8개 리네임:
  - `02_feature_design` → `03_feature_design`
  - `03_api` → `05_api`
  - `04_database` → `06_database`
  - `05_backend` → `07_backend`
  - `06_ai` → `08_ai`
  - `07_flow` → `04_flow`
  - `08_nonfunctional` → `09_nonfunctional`
  - `09_mvp` → `02_mvp`
- `prompts/06_ai_handoff.md` → `prompts/08_ai_handoff.md` (폴더 번호 변경에 일관성 맞춤)
- 28개 .md 파일 내 경로 참조 일괄 갱신 (AGENTS.md, CLAUDE.md, HANDOFF.md, PROGRESS.md, docs/README.md, docs/plan/plan_gantt.md, docs/research/ 전체, docs/spec/ 잔존 참조 포함)
- `docs/README.md` §2 spec 문서 목록 표 순서 재배열:
  - 새 폴더 번호 순서로 정렬
  - `04_flow` 내부: `user_flow.md` → `sequence.md` (사용자 관점 먼저)
  - `08_ai` 내부: `model_spec.md` → `ml_pipeline.md` (모델 정의 먼저)
  - `09_nonfunctional` 내부: `security.md` → `performance.md` (보안 먼저)
- `docs/README.md` §5-3 연동 수정 파일 맵도 같은 순서로 재배열

### 2026-05-07 (5차)

01~09 전체 일관성 검증 수행 (08_ai 제외). 37개 세부 항목 검토, 불일치 5건 수정.

- E-1 (`erd.md`): `inventory_items ||--o{ recipe_ingredients` 중복 선언 제거 → `recipe_ingredients }o--|| inventory_items`(FK 방향) 단일 표현으로 정리
- E-2 (`sequence.md` 섹션 2): 존재하지 않는 `POST /api/auth/register` 호출 제거 → 사업자번호+매장 정보를 `PATCH /api/store` 단일 호출로 통합
- E-3 (`sequence.md` 섹션 2): POS 연동 엔드포인트 `POST /api/store/pos/link` → `POST /api/store/pos`로 수정
- E-4 (`sequence.md` 섹션 4): 추천발주 엔드포인트 `GET /api/orders/recommendations` → `GET /api/orders/recommend`, `PATCH /api/orders/recommendations/{id}` → `PATCH /api/orders/recommend`로 수정
- E-5 (`api_spec.md`, `service_design.md`): 데이터 내보내기·삭제(GDPR) 항목에 "MVP 제외 — 2단계 구현 예정" 주석 추가

### 2026-05-07 (4차)

02_mvp 작성 수행 (`mvp_scope.md` 전면 재작성).

- MVP 목표·1차 검증 업종(주점)·포함/제외 기능·고도화 로드맵·데모 시나리오·성공 기준·데이터 확보 방식·역할 분담 정의

### 2026-05-07 (3차)

09_nonfunctional 전체 작성 (`security.md`, `performance.md`).

- `security.md`: Firebase 제거 → Authlib OAuth 2.0 기준 재작성, 토큰 정책·개인정보 수집 항목·암호화 적용 대상·접근 통제 레이어·감사 로그 대상 추가
- `performance.md`: API별 목표 응답 시간·동시 사용자 기준·캐싱·배치 SLA·Playwright 타임아웃 추가

### 2026-05-07 (2차)

04_flow 전체 작성 (`user_flow.md`, `sequence.md`).

- `user_flow.md`: POS 연동 분기·쿠팡 자동화 실패 분기·온보딩 흐름·화면 IA 등 섹션 9~15 추가
- `sequence.md`: 소셜 로그인·수요예측·발주 시퀀스 전면 재작성, 야간 배치·FIFO·소비기한·Refresh Token 갱신 시퀀스 추가

### 2026-05-07 (1차)

01~05 비판적 일관성 검토. C-series 5건·S-series 6건 발견 및 수정.

- C-1: `coupang_url`/`last_price`가 `inventory_item_sites` JOIN 결과임을 `api_spec.md`, `schema.md`, `service_design.md`에 명시
- C-2: `disposal_logs`에 `user_id` 컬럼 추가 (`schema.md`, `erd.md`, `service_design.md`)
- C-3: `order_recommendations`에 `target_date DATE NOT NULL` 컬럼 추가 (`schema.md`)
- C-4: 쿠팡 자동화가 발주 확정과 독립된 별도 호출임을 `service_design.md` 섹션 6에 명시
- C-5: `DataService` 클래스 및 `export_data`, `delete_data` 메서드 추가 (`service_design.md`)
- S-1~S-6: ERD 관계 추가, 온보딩 출력 정리, 엔드포인트 추가, 단가 조회 흐름·파이프라인 실행 흐름 명시

### 2026-05-06

- `api_spec.md`: 메뉴 API 예시에 `use_inventory_deduction` 필드 추가
- `service_design.md`: 서비스 호출 흐름 섹션 추가 (PosService → SaleService → InventoryService 등)

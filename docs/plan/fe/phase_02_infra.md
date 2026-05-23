# Phase 2 인프라 부트스트랩 — FE

> 상위: [../plan_gantt.md](../plan_gantt.md) §2 Phase 2 / §4 `inf`
> Day: 7~12 (선행: `plan`)

## 마일스톤

| ID | 마일스톤 | 산출물 | 검증 |
|---|---|---|---|
| M2.F1 | Vite + React 19 + TS strict 셋업 | `package.json` (pnpm 9 + Node 22 LTS) + `vite.config.ts` + `tsconfig.json` strict | `pnpm dev` → 빈 페이지 렌더 |
| M2.F2 | Tailwind v4 + shadcn/ui 셋업 | `tailwind.config.ts` + `components.json` (shadcn) + lucide-react | 기본 컴포넌트 1개 렌더 |
| M2.F3 | TanStack Query v5 + ky 1.x 셋업 | `app/lib/api.ts` (ky 인스턴스·credentials: include·401 refresh 인터셉터) + QueryClient | 더미 API 호출 통과 |
| M2.F4 | OpenAPI codegen 셋업 | `openapi-typescript` 7.x → `app/api/types.gen.ts` 자동 생성 스크립트 | `pnpm gen:api` 무오류 |
| M2.F5 | PWA·Sentry·Biome·Vitest 셋업 | vite-plugin-pwa (injectManifest) + @sentry/react + biome.json + vitest.config.ts | 각 도구 1회 실행 통과 |
| M2.F6 | Caddy 이미지 자체 빌드 | `Dockerfile.fe` (멀티스테이지 — pnpm build → Caddy COPY dist) | 컨테이너 기동 + 정적 자산 서빙 |

## 외부 의존

- BE Phase 2 완료 후 OpenAPI 스펙(`/openapi.json`) 접근 가능

## Phase 통합 종료 조건 (M2)

BE·FE 양쪽 모두 컨테이너 기동 + 헬스체크 통과

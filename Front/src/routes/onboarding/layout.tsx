// 온보딩 레이아웃 — 스텝 진행 표시 + Outlet (frontend_design.md §3).
import { NavLink, Outlet, useLocation } from "react-router";

const STEPS = [
  { id: 1, label: "매장 정보" },
  { id: 2, label: "POS 연동" },
  { id: 3, label: "메뉴 등록" },
  { id: 4, label: "확인" },
] as const;

export default function OnboardingLayout() {
  const { pathname } = useLocation();
  const current = Number(pathname.split("/").pop()) || 1;

  return (
    <main className="min-h-dvh bg-slate-50 p-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">매장 온보딩</h1>
          <p className="text-sm text-slate-500">
            기본 정보를 4단계로 입력하면 메인 화면으로 이동합니다.
          </p>
        </header>
        <ol className="grid grid-cols-4 gap-2" aria-label="온보딩 단계">
          {STEPS.map((step) => {
            const done = step.id < current;
            const active = step.id === current;
            return (
              <li
                key={step.id}
                aria-current={active ? "step" : undefined}
                className={`flex flex-col items-start rounded-md border px-3 py-2 ${
                  active
                    ? "border-slate-900 bg-white"
                    : done
                      ? "border-slate-300 bg-slate-100"
                      : "border-dashed border-slate-300 bg-white text-slate-400"
                }`}
              >
                <span className="text-xs">Step {step.id}</span>
                <NavLink
                  to={`/onboarding/${step.id}`}
                  className="text-sm font-medium"
                  // 미완료 단계로 임의 점프 방지: done 단계만 클릭 가능.
                  onClick={(e) => {
                    if (!done && !active) e.preventDefault();
                  }}
                >
                  {step.label}
                </NavLink>
              </li>
            );
          })}
        </ol>
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <Outlet />
        </section>
      </div>
    </main>
  );
}

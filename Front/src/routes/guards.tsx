// 라우트 가드 — frontend_design.md §3 (인증 / 온보딩 완료 여부).
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "../stores/auth-store";

export function RequireGuest({ children }: { children: ReactNode }) {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  if (!bootstrapped) return <SplashScreen />;
  if (token && user) {
    return <Navigate to={user.onboarding_completed ? "/" : "/onboarding/1"} replace />;
  }
  return <>{children}</>;
}

export function RequireAuth({
  children,
  requireOnboarding = true,
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
}) {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  if (!bootstrapped) return <SplashScreen />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (requireOnboarding && !user.onboarding_completed) {
    return <Navigate to="/onboarding/1" replace />;
  }
  if (!requireOnboarding && user.onboarding_completed) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function SplashScreen() {
  return (
    <div
      className="grid min-h-dvh place-items-center bg-slate-50 text-slate-500"
      role="status"
      aria-live="polite"
    >
      <span className="text-sm">로딩 중…</span>
    </div>
  );
}

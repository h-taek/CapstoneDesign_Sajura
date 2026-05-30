// 임시 홈 — Phase 3 종료 조건 "메인 화면 도달" 확인용. 본격 홈은 Phase 11에서.
import { Link } from "react-router";
import { useAuthStore } from "../stores/auth-store";
import { Button } from "../components/ui/button";
import { logout } from "../api/endpoints/auth";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clear();
      window.location.assign("/login");
    }
  };

  return (
    <main className="min-h-dvh bg-slate-50 p-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between pb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">사주라</h1>
          <p className="text-sm text-slate-500">
            {user?.store_name ?? "매장"} · {user?.name ?? ""}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          로그아웃
        </Button>
      </header>
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">온보딩 완료</h2>
        <p className="mt-2 text-sm text-slate-600">
          이어지는 대시보드·재고·예측 화면은 후속 Phase에서 합류합니다.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/settings/pos"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
          >
            POS 연동 설정
          </Link>
          <Link
            to="/sales/upload"
            className="rounded-md bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            매출 CSV 업로드
          </Link>
        </nav>
      </section>
    </main>
  );
}

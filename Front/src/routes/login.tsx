// M3.F1 — 로그인 화면 (frontend_design.md §3 + api_spec.md §2 OAuth 흐름).
import { Button } from "../components/ui/button";
import { oauthLoginUrl } from "../api/endpoints/auth";

export default function LoginPage() {
  const goKakao = () => {
    window.location.assign(oauthLoginUrl("kakao"));
  };
  const goGoogle = () => {
    window.location.assign(oauthLoginUrl("google"));
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">사주라</h1>
          <p className="text-sm text-slate-500">소상공인 재고/발주 PWA</p>
        </header>
        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full bg-[#FEE500] text-slate-900 hover:bg-[#FADA0A]"
            onClick={goKakao}
            data-provider="kakao"
          >
            카카오로 계속하기
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={goGoogle}
            data-provider="google"
          >
            Google로 계속하기
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400">
          계속 진행 시 서비스 약관·개인정보 처리방침에 동의한 것으로 간주됩니다.
        </p>
      </section>
    </main>
  );
}

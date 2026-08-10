// 공용 로그아웃 훅 — 대시보드 셸·사업자 검증·온보딩에서 공유.
// 게이트 화면(/verify-business, /onboarding/*)은 guards.tsx의 landingPath가
// 항상 제자리로 되돌리므로, 로그아웃이 유일한 이탈 경로다.
import { logout } from "../api/endpoints/auth";
import { useAuthStore } from "../stores/auth-store";

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);

  return async () => {
    // 서버 세션 폐기가 실패해도(오프라인·5xx) 로컬 세션은 반드시 비운다.
    // 게이트 화면에서는 이게 유일한 출구라 여기서 던지면 사용자가 갇힌다.
    try {
      await logout();
    } catch {
      // 무시 — 아래 clear()로 클라이언트 세션은 정리된다.
    }
    clear();
    window.location.assign("/login");
  };
}

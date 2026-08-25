// OAuth 더블클릭 회귀 가드 — refreshAccessToken in-flight 공유.
//
// StrictMode가 useEffect를 두 번 실행해도 백엔드 refresh는 1회만 호출돼야
// 한다. BE가 SELECT FOR UPDATE로 옛 토큰을 즉시 revoke하기 때문에 두 번
// 호출되면 두 번째가 401을 받고 부트스트랩이 실패하면서 로그인 화면으로
// 되돌아간다(= 더블클릭 버그).
import { describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { refreshAccessToken } from "../api/endpoints/auth";

describe("refreshAccessToken in-flight 공유", () => {
  it("동시 2회 호출 시 ky.post는 1번만 호출된다", async () => {
    // 응답이 끝나기 전에 두 번째 호출이 들어가도록 지연.
    let resolveOnce: (v: { access_token: string; expires_in: number }) => void;
    const pending = new Promise<{ access_token: string; expires_in: number }>(
      (resolve) => {
        resolveOnce = resolve;
      },
    );
    const postSpy = vi.spyOn(api, "post").mockImplementation(
      // ky 응답 호환 최소 stub — .json() 으로 호출됨.
      () =>
        ({
          json: async () => pending,
        }) as unknown as ReturnType<typeof api.post>,
    );

    const [a, b] = [refreshAccessToken(), refreshAccessToken()];
    resolveOnce!({ access_token: "tok-1", expires_in: 3600 });
    const [ra, rb] = await Promise.all([a, b]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(ra?.access_token).toBe("tok-1");
    expect(rb?.access_token).toBe("tok-1");

    postSpy.mockRestore();
  });

  it("이전 호출이 완료된 뒤의 새 호출은 새 promise를 만든다", async () => {
    const postSpy = vi.spyOn(api, "post").mockImplementation(
      () =>
        ({
          json: async () => ({ access_token: "tok-2", expires_in: 3600 }),
        }) as unknown as ReturnType<typeof api.post>,
    );
    await refreshAccessToken();
    await refreshAccessToken();
    expect(postSpy).toHaveBeenCalledTimes(2);
    postSpy.mockRestore();
  });
});

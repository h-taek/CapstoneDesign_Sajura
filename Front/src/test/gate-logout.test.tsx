// 게이트 화면 이탈 경로 — /verify-business·/onboarding/* 는 guards.tsx의
// landingPath가 항상 제자리로 되돌리므로 로그아웃이 유일한 출구다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "../api/endpoints/auth";
import OnboardingLayout from "../routes/onboarding/layout";
import VerifyBusinessPage from "../routes/verify-business";
import { useAuthStore } from "../stores/auth-store";

const assign = vi.fn();

function renderWithProviders(ui: React.ReactNode, path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("게이트 화면 로그아웃", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    assign.mockClear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign, href: "/" },
    });
    useAuthStore.setState({
      accessToken: "token",
      user: {
        user_id: "u1",
        email: "owner@example.com",
        name: "사장",
        auth_provider: "LOCAL",
        role: "OWNER",
        store_name: null,
        business_no: null,
        business_status: "UNVERIFIED",
        onboarding_completed: false,
      },
      bootstrapped: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clear();
  });

  it("사업자 검증 화면에서 로그아웃하면 토큰을 비우고 /login으로 보낸다", async () => {
    const logoutSpy = vi.spyOn(authApi, "logout").mockResolvedValue(undefined);
    renderWithProviders(<VerifyBusinessPage />, "/verify-business");

    fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("온보딩 화면에서도 로그아웃할 수 있다", async () => {
    const logoutSpy = vi.spyOn(authApi, "logout").mockResolvedValue(undefined);
    renderWithProviders(<OnboardingLayout />, "/onboarding/1");

    fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("logout API가 실패해도 로컬 세션은 비우고 /login으로 보낸다", async () => {
    vi.spyOn(authApi, "logout").mockRejectedValue(new Error("network"));
    renderWithProviders(<VerifyBusinessPage />, "/verify-business");

    fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});

// M3.F10 — 관리자 심사 화면 E2E.
// 시나리오: ADMIN 부트스트랩 → /admin/verifications 목록 → 승인 → 목록 갱신.
//   비ADMIN(OWNER)은 /admin/verifications 접근 시 리다이렉트.
import { expect, test } from "@playwright/test";

function meBody(role: "ADMIN" | "OWNER") {
  return {
    user_id: "admin-1",
    email: "admin@example.com",
    name: "관리자",
    auth_provider: "LOCAL",
    role,
    store_name: null,
    business_no: null,
    business_status: "VERIFIED",
    onboarding_completed: true,
  };
}

const PENDING_ITEM = {
  store_id: "store-1",
  user_email: "owner@example.com",
  business_no: "123-45-67890",
  business_status: "PENDING",
  cert_url: "/api/admin/verifications/store-1/cert",
  submitted_at: "2026-01-01T00:00:00Z",
};

test.describe("admin verifications", () => {
  test("ADMIN approves a pending verification", async ({ page }) => {
    let approved = false;
    await page.route("**/api/auth/refresh", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ access_token: "fake", token_type: "bearer", expires_in: 3600 }),
      }),
    );
    await page.route("**/api/auth/me", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(meBody("ADMIN")),
      }),
    );
    await page.route("**/api/admin/verifications?**", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: approved ? [] : [PENDING_ITEM],
          total: approved ? 0 : 1,
          page: 1,
          size: 100,
          total_pages: approved ? 0 : 1,
        }),
      }),
    );
    await page.route("**/api/admin/verifications/store-1/approve", async (route) => {
      approved = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ store_id: "store-1", business_status: "VERIFIED" }),
      });
    });

    await page.goto("/admin/verifications");
    await expect(page.getByText("owner@example.com")).toBeVisible();
    await page.getByRole("button", { name: "승인" }).click();

    // 승인 후 목록 갱신 → 빈 상태.
    await expect(page.getByTestId("admin-empty")).toBeVisible();
  });

  test("non-admin is redirected away from /admin", async ({ page }) => {
    await page.route("**/api/auth/refresh", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ access_token: "fake", token_type: "bearer", expires_in: 3600 }),
      }),
    );
    await page.route("**/api/auth/me", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(meBody("OWNER")),
      }),
    );
    await page.goto("/admin/verifications");
    // OWNER + VERIFIED + 온보딩 완료 → landingPath "/" 로 리다이렉트.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "사업자 검증 심사" })).toHaveCount(0);
  });
});

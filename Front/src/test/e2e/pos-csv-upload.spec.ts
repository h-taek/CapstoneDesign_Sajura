// M4.F1·F2·F3 E2E — POS 설정 → CSV 업로드 → 결과 표시.
// BE는 라우트 인터셉트로 모킹: refresh / me / store / pos/status / sales/upload.
import { expect, test } from "@playwright/test";

const FAKE_USER = {
  user_id: "u-1",
  email: "owner@example.com",
  name: "홍길동",
  auth_provider: "EMAIL",
  store_name: "길동 카페",
  business_no: "123-45-67890",
  business_status: "VERIFIED",
  onboarding_completed: true,
};

test.describe("POS 설정 → CSV 업로드", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake.jwt.token",
          token_type: "bearer",
          expires_in: 3600,
        }),
      });
    });
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_USER),
      });
    });
    await page.route("**/api/store/pos/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "CSV_MODE",
          last_synced_at: null,
          error_message: null,
        }),
      });
    });
    await page.route("**/api/sales/upload", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          imported: 2,
          skipped: 1,
          skipped_reasons: ["3행: 매장 메뉴와 매핑 실패"],
          anomaly_count: 0,
        }),
      });
    });
  });

  test("설정 화면에서 업로드 화면 진입 → 파일 업로드 → 결과 표시", async ({ page }) => {
    await page.goto("/settings/pos");

    await expect(page.getByRole("heading", { name: "POS 연동 설정" })).toBeVisible();
    await expect(page.getByText("CSV 업로드 모드")).toBeVisible();

    await page.getByRole("button", { name: /업로드 화면으로 이동/ }).click();
    await expect(page).toHaveURL(/\/sales\/upload$/);

    // CSV 파일 선택 (in-memory 생성).
    const csv = "날짜,메뉴명,수량,금액,영수증번호\n2026-01-15,아메리카노,1,4500,r1\n";
    await page.setInputFiles('[data-testid="file-input"]', {
      name: "sales.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf-8"),
    });
    await expect(page.getByText("sales.csv")).toBeVisible();

    await page.getByRole("button", { name: "업로드 시작" }).click();

    const result = page.getByTestId("upload-result");
    await expect(result).toBeVisible();
    await expect(result).toContainText("2");
    await expect(result).toContainText("1");
    await expect(page.getByText("제외된 행 1건 보기")).toBeVisible();
  });
});

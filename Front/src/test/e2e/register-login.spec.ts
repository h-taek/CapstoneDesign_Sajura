// M3.F8·F9 — 자체 회원가입 + 사업자 검증 게이트 E2E.
// 시나리오: 회원가입(email·pw·name) → 로그인 → /verify-business(번호+등록증 업로드)
//   → PENDING → 온보딩 1스텝. BE 미완성 환경에서도 라우팅·폼·가드를 검증하도록 모킹.
import { expect, test } from "@playwright/test";

const EMAIL = "owner@example.com";

test.describe("self register + business verify", () => {
  test.beforeEach(async ({ page }) => {
    // me 상태: 검증 전 UNVERIFIED → verify 호출 후 PENDING으로 전환.
    let businessStatus: "UNVERIFIED" | "PENDING" = "UNVERIFIED";

    await page.route("**/api/auth/refresh", async (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "AUTH_REFRESH_TOKEN_INVALID" }),
      }),
    );
    await page.route("**/api/auth/register", async (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ user_id: "u-1", email: EMAIL, name: "홍길동" }),
      }),
    );
    await page.route("**/api/auth/login", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake.jwt.token",
          token_type: "bearer",
          expires_in: 3600,
          business_status: businessStatus,
          onboarding_completed: false,
        }),
      }),
    );
    await page.route("**/api/store/business/verify", async (route) => {
      businessStatus = "PENDING";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ business_status: "PENDING", business_no: "123-45-67890" }),
      });
    });
    await page.route("**/api/auth/me", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user_id: "u-1",
          email: EMAIL,
          name: "홍길동",
          auth_provider: "LOCAL",
          store_name: null,
          business_no: null,
          business_status: businessStatus,
          onboarding_completed: false,
        }),
      }),
    );
  });

  test("register → login → verify (upload) → onboarding step 1", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill("supersecret");
    await page.locator("#password_confirm").fill("supersecret");
    await page.locator("#name").fill("홍길동");
    await page.getByRole("button", { name: "가입하기" }).click();

    // 로그인 화면 진입 + 이메일 프리필.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("#email")).toHaveValue(EMAIL);

    await page.locator("#password").fill("supersecret");
    await page.getByRole("button", { name: "로그인" }).click();

    // 미검증(UNVERIFIED) → 사업자 검증 화면으로 강제 이동.
    await expect(page).toHaveURL(/\/verify-business$/);

    // 사업자번호 + 등록증 업로드.
    await page.locator("#business_no").fill("1234567890");
    await expect(page.locator("#business_no")).toHaveValue("123-45-67890");
    await page.locator("#cert").setInputFiles({
      name: "cert.png",
      mimeType: "image/png",
      buffer: Buffer.from("\x89PNG\r\n\x1a\n_dummy_"),
    });
    await page.getByRole("button", { name: "제출하기" }).click();

    // PENDING → 온보딩 1스텝.
    await expect(page).toHaveURL(/\/onboarding\/1$/);
  });

  test("verify-business blocks submit without cert file", async ({ page }) => {
    // refresh를 PENDING 사용자로 부트스트랩하면 가드가 검증 화면을 건너뛰므로,
    // 미검증 상태로 직접 진입시키기 위해 login 경로로 도달한다.
    await page.goto("/login");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill("supersecret");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page).toHaveURL(/\/verify-business$/);

    await page.locator("#business_no").fill("1234567890");
    await page.getByRole("button", { name: "제출하기" }).click();
    await expect(page.getByText("사업자등록증 파일을 첨부하세요.")).toBeVisible();
    await expect(page).toHaveURL(/\/verify-business$/);
  });

  test("register form rejects mismatched password", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill("supersecret");
    await page.locator("#password_confirm").fill("different");
    await page.locator("#name").fill("홍길동");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("비밀번호가 일치하지 않습니다.")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});

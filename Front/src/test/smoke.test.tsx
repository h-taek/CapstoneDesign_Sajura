import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import LoginPage from "../routes/login";

function renderLogin() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  it("renders email/password form and OAuth buttons", () => {
    renderLogin();
    expect(screen.getByRole("heading", { name: /Sajura/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인하기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /카카오로 시작하기/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /구글로 시작하기/ })).toBeInTheDocument();
  });
});

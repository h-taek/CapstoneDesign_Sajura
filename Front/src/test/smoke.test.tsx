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
    expect(screen.getByRole("heading", { name: "사주라" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /카카오로 계속하기/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Google로 계속하기/ })).toBeInTheDocument();
  });
});

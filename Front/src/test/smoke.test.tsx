import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoginPage from "../routes/login";

describe("LoginPage", () => {
  it("renders OAuth buttons", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "사주라" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /카카오로 계속하기/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Google로 계속하기/ })).toBeInTheDocument();
  });
});

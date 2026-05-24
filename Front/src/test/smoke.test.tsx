import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("App", () => {
  it("renders the bootstrap heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "사주라" })).toBeInTheDocument();
  });
});

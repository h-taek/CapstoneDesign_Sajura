// 라우터 정의 — frontend_design.md §3.
import { createBrowserRouter, Navigate } from "react-router";
import LoginPage from "./login";
import HomePage from "./home";
import OnboardingLayout from "./onboarding/layout";
import StoreStep from "./onboarding/step-store";
import PosStep from "./onboarding/step-pos";
import MenusStep from "./onboarding/step-menus";
import ConfirmStep from "./onboarding/step-confirm";
import { RequireAuth, RequireGuest } from "./guards";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    ),
  },
  {
    path: "/onboarding",
    element: (
      <RequireAuth requireOnboarding={false}>
        <OnboardingLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/onboarding/1" replace /> },
      { path: "1", element: <StoreStep /> },
      { path: "2", element: <PosStep /> },
      { path: "3", element: <MenusStep /> },
      { path: "4", element: <ConfirmStep /> },
    ],
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <HomePage />
      </RequireAuth>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

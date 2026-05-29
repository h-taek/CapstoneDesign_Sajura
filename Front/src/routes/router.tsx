// 라우터 정의 — frontend_design.md §3.
import { Navigate, createBrowserRouter } from "react-router";
import { RequireGuest, RequireStage } from "./guards";
import HomePage from "./home";
import LoginPage from "./login";
import OnboardingLayout from "./onboarding/layout";
import ConfirmStep from "./onboarding/step-confirm";
import MenusStep from "./onboarding/step-menus";
import PosStep from "./onboarding/step-pos";
import StoreStep from "./onboarding/step-store";
import RegisterPage from "./register";
import VerifyBusinessPage from "./verify-business";

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
    path: "/register",
    element: (
      <RequireGuest>
        <RegisterPage />
      </RequireGuest>
    ),
  },
  {
    path: "/verify-business",
    element: (
      <RequireStage stage="verify">
        <VerifyBusinessPage />
      </RequireStage>
    ),
  },
  {
    path: "/onboarding",
    element: (
      <RequireStage stage="onboarding">
        <OnboardingLayout />
      </RequireStage>
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
      <RequireStage stage="app">
        <HomePage />
      </RequireStage>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

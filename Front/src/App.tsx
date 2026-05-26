// 앱 루트 — QueryClient + Router + auth bootstrap.
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { queryClient } from "./lib/query-client";
import { router } from "./routes/router";
import { useAuthBootstrap } from "./features/auth/use-auth-bootstrap";

function RouterWithBootstrap() {
  useAuthBootstrap();
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterWithBootstrap />
    </QueryClientProvider>
  );
}

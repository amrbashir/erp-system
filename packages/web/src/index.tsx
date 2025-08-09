import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";

import { AuthProvider, useAuth } from "@/providers/auth.tsx";
import { ThemeProvider } from "@/providers/theme.tsx";
import { routeTree } from "@/routeTree.gen.ts"; // Import the generated route tree
import { queryClient } from "@/trpc.ts";

import "@erp-system/utils/super-json-ext";
import "./i18n.ts";
import "./index.css";

const router = createRouter({
  routeTree,
  // eslint-disable-next-line
  context: undefined!,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AuthApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  const { i18n } = useTranslation();
  React.useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir();
  }, [i18n.language]);

  return (
    <DirectionProvider dir={i18n.dir()}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthApp />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </DirectionProvider>
  );
}

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

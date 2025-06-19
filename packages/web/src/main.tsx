import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";
import "./i18n";
import { AuthProvider, useAuth } from "@/auth";

// Import the generated route tree
import { routeTree } from "@/routeTree.gen";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: undefined!,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.body).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

import { SidebarProvider } from "@/components/ui/sidebar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppSideBar } from "@/components/app-sidebar";
import { NavigationHeader } from "@/components/navigation-header";

export const Route = createRootRoute({
  component: () => {
    const cookies = document.cookie.split("; ");
    const sidebarState = cookies.find((c) => c.startsWith("sidebar_state="))?.split("=")[1];
    const defaultOpen = sidebarState === "true";

    return (
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSideBar />
        <main className="w-full h-full *:px-4 *:py-2">
          <NavigationHeader />
          <Outlet />
        </main>
      </SidebarProvider>
    );
  },
});

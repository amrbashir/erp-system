import { SidebarProvider } from "@/components/ui/sidebar";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import { AppSideBar } from "@/components/app-sidebar";
import { NavigationHeader } from "@/components/navigation-header";
import { ThemeProvider } from "@/components/theme-provider";

type RouterContext = {
  title: string;
  icon: React.ComponentType;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    const cookies = document.cookie.split("; ");
    const sidebarState = cookies.find((c) => c.startsWith("sidebar_state="))?.split("=")[1];
    const defaultOpen = sidebarState === "true";

    const matches = useMatches();
    const matchWithTitle = [...matches].reverse().find((match) => match.context.title);
    const title = matchWithTitle?.context.title;

    return (
      <>
        <head>
          <HeadContent />
          <title>{title + " | Tech Zone Store"}</title>
        </head>

        <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSideBar />
            <main className="w-full h-full *:px-4 *:py-2">
              <NavigationHeader />
              <Outlet />
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </>
    );
  },
});

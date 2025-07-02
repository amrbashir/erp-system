import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

export function AppSidebarProvider({ children }: { children: React.ReactNode }) {
  const cookies = document.cookie.split("; ");
  const sidebarState = cookies.find((c) => c.startsWith("sidebar_state="))?.split("=")[1];
  const defaultOpen = sidebarState === "true";

  return <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>;
}

import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { useTranslation } from "react-i18next";
import type { AuthContext } from "@/auth/hook";
import { DirectionProvider } from "@radix-ui/react-direction";
import { useEffect } from "react";
import type { UserEntity } from "@tech-zone-store/sdk/zod";
import { z } from "zod";
import { Toaster } from "@/shadcn/components/ui/sonner";
import i18n from "@/i18n";

interface RouterContext {
  auth: AuthContext;
  title: string;
  icon?: React.ComponentType;
  roleRequirement?: z.infer<typeof UserEntity>["role"];
  hideUI?: boolean;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
  head: (c) => {
    const currentMatch = c.matches[c.matches.length - 1];
    const routeTitle = currentMatch.context.title ? currentMatch.context.title : "";
    const orgSlug = "orgSlug" in c.params && c.params.orgSlug ? c.params.orgSlug : "";
    const appTitle = i18n.t("tech_zone");
    const title = [routeTitle, orgSlug, appTitle].filter(Boolean).join(" | ");

    return {
      meta: [
        {
          title,
        },
      ],
    };
  },
});

function Root() {
  const { i18n } = useTranslation("translation");
  useEffect(() => void (document.documentElement.dir = i18n.dir()), [i18n.language]);

  return (
    <DirectionProvider dir={i18n.dir()}>
      <ThemeProvider>
        <HeadContent />
        <Outlet />
        <Toaster position={i18n.dir() === "rtl" ? "bottom-left" : "bottom-right"} />
      </ThemeProvider>
    </DirectionProvider>
  );
}

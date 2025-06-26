import { DirectionProvider } from "@radix-ui/react-direction";
import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Toaster } from "@/shadcn/components/ui/sonner";

import type { UserEntity } from "@erp-system/sdk/zod";

import type { AuthProviderState } from "@/providers/auth-provider";
import { NonOrgHeader } from "@/components/non-org-header";
import { ThemeProvider } from "@/providers/theme-provider";

interface RouterContext {
  auth: AuthProviderState;
  title: string;
  icon?: React.ComponentType;
  roleRequirement?: z.infer<typeof UserEntity>["role"];
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
  head: (c) => {
    const currentMatch = c.matches[c.matches.length - 1];
    const routeTitle = currentMatch.context.title ? currentMatch.context.title : "";
    const orgSlug = "orgSlug" in c.params && c.params.orgSlug ? c.params.orgSlug : "";
    const title = [routeTitle, orgSlug, "erp-system"].filter(Boolean).join(" | ");

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

        <NonOrgHeader />
        <Toaster position={i18n.dir() === "rtl" ? "bottom-left" : "bottom-right"} />
      </ThemeProvider>
    </DirectionProvider>
  );
}

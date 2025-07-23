import { DirectionProvider } from "@radix-ui/react-direction";
import { createRootRouteWithContext, HeadContent, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/shadcn/components/ui/button";
import { Toaster } from "@/shadcn/components/ui/sonner";

import type { UserEntity } from "@erp-system/sdk/zod";

import type { AuthProviderState } from "@/providers/auth";
import { Header } from "@/components/header";
import { ButtonLink } from "@/components/ui/ButtonLink";
import i18n from "@/i18n";
import { ThemeProvider } from "@/providers/theme";

interface RouterContext {
  auth: AuthProviderState;
  title: string;
  icon?: React.ComponentType;
  roleRequirement?: z.infer<typeof UserEntity>["role"];
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFound404,
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
  beforeLoad: (c) => {
    const currentMatch = c.matches[c.matches.length - 1];
    const { roleRequirement, auth } = currentMatch.context;

    if (roleRequirement && auth.user?.role !== roleRequirement) {
      throw new Error(i18n.t("errors.notAuthorized"));
    }
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation("translation");
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir();
  }, [i18n.language]);

  return (
    <DirectionProvider dir={i18n.dir()}>
      <ThemeProvider>
        <HeadContent />
        <Header />

        {children}

        <Toaster position={i18n.dir() === "rtl" ? "bottom-left" : "bottom-right"} />
      </ThemeProvider>
    </DirectionProvider>
  );
}

function RouteComponent() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function NotFound404() {
  const { t } = useTranslation();

  return (
    <main className="h-(--fullheight-minus-header) w-full flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl!">{t("common.ui.oops")}</h1>
        <br />
        <br />
        <p>404 - {t("notFound404")}</p>
        <br />
        <br />
        <ButtonLink to="/">{t("goBackHome")}</ButtonLink>
      </div>
    </main>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation();

  return (
    <Layout>
      <main className="h-(--fullheight-minus-header) w-full flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-9xl!">{t("common.ui.oops")}</h1>
          <br />
          <br />
          <p>{error.message}</p>
          <br />
          <br />
          <ButtonLink to="/">{t("goBackHome")}</ButtonLink>
        </div>
      </main>
    </Layout>
  );
}

import { DirectionProvider } from "@radix-ui/react-direction";
import { createRootRouteWithContext, HeadContent, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/shadcn/components/ui/button";
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
  errorComponent: ErrorComponent,
  notFoundComponent: NotFound404,
  head: (c) => {
    const currentMatch = c.matches[c.matches.length - 1];
    const routeTitle = currentMatch.context.title ? currentMatch.context.title : "";
    const paramOrgSlug = "orgSlug" in c.params && c.params.orgSlug ? c.params.orgSlug : "";
    const searchParamsOrgSlug =
      "orgSlug" in c.match.search && c.match.search.orgSlug ? c.match.search.orgSlug : "";
    const orgSlug = paramOrgSlug || searchParamsOrgSlug;
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
        <NonOrgHeader />

        <Outlet />

        <Toaster position={i18n.dir() === "rtl" ? "bottom-left" : "bottom-right"} />
      </ThemeProvider>
    </DirectionProvider>
  );
}

function NotFound404() {
  const { t } = useTranslation();

  return (
    <div className="h-(--fullheight-minus-header) w-full flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl!">{t("oops")}</h1>
        <br />
        <br />
        <p>404 - {t("notFound404")}</p>
        <br />
        <br />
        <Button>
          <Link to="/">{t("goBackHome")}</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation();

  return (
    <div className="h-(--fullheight-minus-header) w-full flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl!">{t("oops")}</h1>
        <br />
        <br />
        <p>{error.message}</p>
        <br />
        <br />
        <Button>
          <Link to="/">{t("goBackHome")}</Link>
        </Button>
      </div>
    </div>
  );
}

import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  stripSearchParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Toaster } from "@/shadcn/components/ui/sonner.tsx";

import type { UserRole } from "@erp-system/server/prisma/index.ts";
import type * as React from "react";

import type { AuthProviderState } from "@/providers/auth.tsx";
import { NotFound404 } from "@/components/404.tsx";
import { Header } from "@/components/header.tsx";
import { ButtonLink } from "@/components/ui/button-link.tsx";
import i18n from "@/i18n.ts";

interface RouterContext {
  auth: AuthProviderState;
  title: string;
  icon?: React.ComponentType;
  roleRequirement?: UserRole;
}

const defaultSearchParams = {
  page: 0,
  pageSize: 30,
  sorting: [],
};

const searchSchema = z.object({
  redirect: z.string().optional(),
  loginOrgSlug: z.string().optional(),
  loginUsername: z.string().optional(),

  // Pagination and sorting parameters
  page: z.number().default(defaultSearchParams.page),
  pageSize: z.number().default(defaultSearchParams.pageSize),
  sorting: z
    .array(
      z.object({
        orderBy: z.string(),
        desc: z.boolean(),
      }),
    )
    .default([]),
});

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound404 />,
  validateSearch: searchSchema,
  search: {
    // strip default values
    middlewares: [stripSearchParams(defaultSearchParams)],
  },
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

    // Redirect to org if authenticated and on root route
    if (auth.isAuthenticated && currentMatch.routeId === "/") {
      throw redirect({ to: "/orgs/$orgSlug", params: { orgSlug: auth.user.orgSlug } });
    }
  },
});

function RouteComponent() {
  return (
    <>
      <HeadContent />
      <Header />
      <Outlet />
      <Toaster richColors position={i18n.dir() === "rtl" ? "bottom-left" : "bottom-right"} />
    </>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  const { t } = useTranslation();

  return (
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
  );
}

import { useRouterState } from "@tanstack/react-router";

import type { OrganizationEntity } from "@erp-system/sdk/zod";
import type z from "zod";

type Organization = z.infer<ReturnType<(typeof OrganizationEntity)["strict"]>>;

export function useOrg<TStrict extends boolean = true>(options?: {
  strict?: TStrict;
}): TStrict extends true ? Organization : Organization | undefined {
  const { strict = true } = options ?? {};
  const match = useRouterState({
    select: (s) => s.matches.find((m) => m.routeId.startsWith("/org/")),
  });
  const org = match?.loaderData;
  if (!org && strict) throw new Error("useOrg must be used within an /org/$orgSlug route");
  return org as TStrict extends true ? Organization : Organization | undefined;
}

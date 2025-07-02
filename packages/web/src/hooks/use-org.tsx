import { getRouteApi } from "@tanstack/react-router";

function useOrgSafe() {
  try {
    const routeApi = getRouteApi("/org");
    const org = routeApi.useLoaderData();
    return org ?? null;
  } catch (error) {
    // If the route is not found or the loader fails, return null
    return null;
  }
}

type OrgOrNull = ReturnType<typeof useOrgSafe>;
type ReturnTypeOrg<TStrict> = TStrict extends true ? NonNullable<OrgOrNull> : OrgOrNull;

export function useOrg<TStrict extends boolean = true>(
  options: { strict: TStrict } = { strict: true as TStrict },
): ReturnTypeOrg<TStrict> {
  const org = useOrgSafe();
  if (!org && options.strict) throw new Error("useOrg must be used within an /org/$orgSlug route");
  return org as ReturnTypeOrg<TStrict>;
}

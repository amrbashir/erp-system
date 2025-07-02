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

// Function overloads
export function useOrg(): NonNullable<OrgOrNull>;
export function useOrg(options: { strict: true }): NonNullable<OrgOrNull>;
export function useOrg(options: { strict: false }): OrgOrNull;
export function useOrg(options: { strict: boolean } = { strict: true }): OrgOrNull {
  const org = useOrgSafe();
  if (!org && options.strict) throw new Error("useOrg must be used within an /org/$orgSlug route");
  return org;
}

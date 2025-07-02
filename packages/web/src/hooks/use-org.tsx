import { getRouteApi } from "@tanstack/react-router";

export const useOrgSafe = () => {
  const routeApi = getRouteApi("/org");
  const org = routeApi.useLoaderData();
  return org || null;
};

export const useOrg = () => {
  const org = useOrgSafe();
  if (!org) throw new Error("useOrg must be used within an /org/$orgSlug route");
  return org;
};

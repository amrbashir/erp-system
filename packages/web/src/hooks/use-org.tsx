import { getRouteApi } from "@tanstack/react-router";

export const useOrg = () => {
  const routeApi = getRouteApi("/org");
  const org = routeApi.useLoaderData();
  if (!org) throw new Error("useOrg must be used within an /org/$orgSlug route");

  return org;
};

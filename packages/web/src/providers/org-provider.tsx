import { OrganizationEntity } from "@erp-system/sdk/zod";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";

import type z from "zod";

import { apiClient } from "@/api-client";

export type ThemeProviderProps = {
  children: React.ReactNode;
};

const OrgProviderContext = createContext<z.infer<typeof OrganizationEntity> | null>(null);

export function OrgProvider({ children, ...props }: ThemeProviderProps) {
  const { t } = useTranslation();
  const { orgSlug } = useParams({ strict: false });

  if (!orgSlug) {
    throw new Error("OrgProvider must be used within a route that has orgSlug in params");
  }

  const { data: org, isLoading } = useQuery({
    queryKey: ["org", orgSlug],
    queryFn: async () => apiClient.get("/org/{orgSlug}", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return isLoading ? (
    <div className="min-h-svh p-6 flex flex-col items-center justify-center gap-4">
      <Loader2Icon className="animate-spin" />
      <p>{t("loadingOrganization")}</p>
    </div>
  ) : org ? (
    <OrgProviderContext.Provider value={org} {...props}>
      {children}
    </OrgProviderContext.Provider>
  ) : (
    <div className="min-h-svh p-6 flex flex-col items-center justify-center gap-4">
      <AlertCircleIcon />
      <p>{t("errors.organizationNotFound")}</p>
    </div>
  );
}

export const useOrg = () => {
  const context = useContext(OrgProviderContext);
  if (!context) throw new Error("useOrg must be used within an OrgProvider");
  return context;
};

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Decimal } from "decimal.js";
import { Building2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";

import { apiClient } from "@/api-client";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { formatMoney } from "@/utils/formatMoney";

import { AddBalanceDialog } from "./-add-balance-dialog";

export const Route = createFileRoute("/orgs/$orgSlug/overview")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.overview"),
    icon: Building2Icon,
    roleRequirement: "ADMIN",
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { slug: orgSlug } = useOrg();

  const { data: org } = useQuery({
    queryKey: ["organizationOverview", orgSlug],
    queryFn: async () =>
      await apiClient.getThrowing("/orgs/{orgSlug}", {
        params: { path: { orgSlug } },
      }),
    select: (res) => res.data,
  });

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="p-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t("org.name")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {org?.name}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t("common.form.balance")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              <span
                className={
                  new Decimal(org?.balance || 0).isNegative()
                    ? "text-red-500 dark:text-red-300"
                    : "text-green-500 dark:text-green-300"
                }
              >
                {formatMoney(org?.balance || 0)}
              </span>
            </CardTitle>
            <CardAction>
              <AddBalanceDialog shortLabel />
            </CardAction>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

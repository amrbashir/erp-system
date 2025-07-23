import { BalanceAtDateStisticDto } from "@erp-system/sdk/zod";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Decimal } from "decimal.js";
import { Building2Icon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shadcn/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/shadcn/components/ui/toggle-group";

import type z from "zod";

import type { ChartConfig } from "@/shadcn/components/ui/chart";
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
      await apiClient.getThrowing("/orgs/{orgSlug}/statistics", {
        params: { path: { orgSlug } },
      }),
    select: (res) => res.data,
  });

  if (!org) return null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="*:data-[slot=card]:from-white/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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
                  new Decimal(org.balance || 0).isNegative()
                    ? "text-red-500 dark:text-red-300"
                    : "text-green-500 dark:text-green-300"
                }
              >
                {formatMoney(org.balance || 0)}
              </span>
            </CardTitle>
            <CardAction>
              <AddBalanceDialog shortLabel />
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      <BalanceStatistics balanceAtDate={org.statistics?.balanceAtDate!} />
    </div>
  );
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function BalanceStatistics({
  balanceAtDate,
}: {
  balanceAtDate: z.infer<typeof BalanceAtDateStisticDto>[];
}) {
  const { t, i18n } = useTranslation();

  const [timeRange, setTimeRange] = useState("30d");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.dailyBalance")}</CardTitle>
        <CardDescription>
          {t("overview.dailyBalanceDescription", { count: timeRange === "30d" ? 30 : 7 })}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            variant="outline"
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <ToggleGroupItem value="30d">{t("overview.last30Days")}</ToggleGroupItem>
            <ToggleGroupItem value="7d">{t("overview.last7Days")}</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={balanceAtDate}>
            <defs>
              <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              reversed={i18n.dir() === "rtl"}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(i18n.language, {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value) => formatMoney(value as string)}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString(i18n.language, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
              }
            />
            <Area
              dataKey="balance"
              type="natural"
              fill="url(#fillBalance)"
              stroke="var(--color-balance)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

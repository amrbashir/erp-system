import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card.tsx";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shadcn/components/ui/chart.tsx";

import type { Decimal } from "decimal.js";

import type { ChartConfig } from "@/shadcn/components/ui/chart.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

import { AddBalanceDialog } from "./-add-balance-dialog.tsx";

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
  const { orgSlug } = useAuthUser();

  const { data: statistics } = useQuery(trpc.orgs.getStatistics.queryOptions({ orgSlug }));

  if (!statistics) return null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="*:data-[slot=card]:from-white/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid sm:grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t("org.name")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {statistics.name}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t("common.form.balance")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              <span
                className={
                  statistics.balance.isNegative()
                    ? "text-red-500 dark:text-red-300"
                    : "text-green-500 dark:text-green-300"
                }
              >
                {formatMoney(statistics.balance || 0)}
              </span>
            </CardTitle>
            <CardAction>
              <AddBalanceDialog shortLabel />
            </CardAction>
          </CardHeader>
        </Card>
      </div>

      <BalanceStatistics
        transactionCount={statistics.transactionCount}
        balanceAtDate={statistics.balanceAtDate}
      />
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
  transactionCount,
  balanceAtDate,
}: {
  transactionCount: number;
  balanceAtDate: { date: Date; balance: Decimal }[];
}) {
  const { t, i18n } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.dailyBalance")}</CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <span>{t("overview.dailyBalanceDescription", { count: 30 })}</span>
          <span>
            {t("transactionCount")}: {transactionCount}
          </span>
        </CardDescription>
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

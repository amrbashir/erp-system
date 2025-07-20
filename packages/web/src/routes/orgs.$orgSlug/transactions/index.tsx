import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BanknoteIcon } from "lucide-react";

import { apiClient } from "@/api-client";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

import { TransactionsTable } from "./-transactions-table";

export const Route = createFileRoute("/orgs/$orgSlug/transactions/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.transactions"),
    icon: BanknoteIcon,
    roleRequirement: "ADMIN",
  }),
});

function RouteComponent() {
  const { slug: orgSlug } = useOrg();

  const { data: transactions } = useQuery({
    queryKey: ["transactions", orgSlug],
    queryFn: async () =>
      apiClient.getThrowing("/orgs/{orgSlug}/transactions", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <div className="gap-4 p-4">
      <TransactionsTable transactions={transactions} />
    </div>
  );
}

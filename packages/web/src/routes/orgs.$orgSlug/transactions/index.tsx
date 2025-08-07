import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BanknoteIcon } from "lucide-react";

import { TransactionsTable } from "./-transactions-table.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/transactions/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.transactions"),
    icon: BanknoteIcon,
    roleRequirement: "ADMIN",
  }),
});

function RouteComponent() {
  const { orgSlug } = useAuthUser();

  const { data: transactions } = useQuery(trpc.orgs.transactions.getAll.queryOptions({ orgSlug }));

  return (
    <div className="gap-4 p-4">
      <TransactionsTable transactions={transactions} />
    </div>
  );
}

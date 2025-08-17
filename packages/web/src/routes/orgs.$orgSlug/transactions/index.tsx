import { createFileRoute } from "@tanstack/react-router";
import { BanknoteIcon } from "lucide-react";

import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";

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

  return (
    <div className="flex flex-col gap-4 p-4">
      <TransactionsTable input={{ orgSlug }} procedure={trpc.orgs.transactions.getAll} />
    </div>
  );
}

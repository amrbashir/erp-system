import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { ShoppingCartIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { DataTableServerPaginated } from "@/components/ui/data-table-server-paginated.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

import { AddExpenseDialog } from "./-add-expense-dialog.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/expenses/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.expenses"),
    icon: ShoppingCartIcon,
  }),
});

const procedure = trpc.orgs.expenses.getAll;
const columnHelper = createColumnHelper<(typeof procedure)["~types"]["output"]["data"][number]>();

function RouteComponent() {
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "index",
        header: t("common.ui.number"),
        cell: (info) => info.row.index + 1,
      }),
      columnHelper.accessor("description", {
        header: t("common.form.description"),
      }),
      columnHelper.accessor("amount", {
        header: t("common.form.amount"),
        cell: ({ row }) => (
          <span className="text-red-500 dark:text-red-300">{formatMoney(row.original.amount)}</span>
        ),
      }),
      columnHelper.accessor("transactionId", {
        header: t("transactionNumber"),
      }),
      columnHelper.accessor("cashier.username", {
        header: t("cashierName"),
      }),
      columnHelper.accessor("createdAt", {
        header: t("common.dates.createdAt"),
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <AddExpenseDialog />
      </div>

      <DataTableServerPaginated procedure={procedure} input={{ orgSlug }} columns={columns} />
    </div>
  );
}

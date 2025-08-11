import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { ShoppingCartIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/ui/data-table.tsx";
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

function RouteComponent() {
  const { orgSlug } = useAuthUser();
  const { t } = useTranslation();

  const { data: expenses } = useQuery(trpc.orgs.expenses.getAll.queryOptions({ orgSlug }));

  type ExpenseRow = {
    id: string | number;
    description: string;
    amount: any;
    transactionId: string | number | null;
    cashier: { username: string };
    createdAt: string | Date;
  };

  const columnHelper = createColumnHelper<ExpenseRow>();
  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "index",
        header: t("common.ui.number"),
        cell: (info) => info.row.index + 1,
      }),
      {
        accessorKey: "description",
        header: t("common.form.description"),
      },
      columnHelper.accessor("amount", {
        header: t("common.form.amount"),
        cell: ({ row }) => (
          <span className="text-red-500 dark:text-red-300">{formatMoney(row.original.amount)}</span>
        ),
      }),
      {
        accessorKey: "transactionId",
        header: t("transactionNumber"),
      },
      { accessorKey: "cashier.username", header: t("cashierName") },
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

      <DataTable columns={columns} data={(expenses as ExpenseRow[]) ?? []} />
    </div>
  );
}

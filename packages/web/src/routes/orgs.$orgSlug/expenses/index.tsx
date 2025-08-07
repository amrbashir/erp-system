import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCartIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table.tsx";

import { EmptyTable } from "@/components/empty-table.tsx";
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <AddExpenseDialog />
      </div>

      {expenses && expenses.length > 0 ? (
        <div className="rounded border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("common.ui.number")}</TableHead>
                <TableHead>{t("common.form.description")}</TableHead>
                <TableHead>{t("common.form.amount")}</TableHead>
                <TableHead>{t("transactionNumber")}</TableHead>
                <TableHead>{t("cashierName")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, index) => (
                <TableRow key={expense.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="text-red-500 dark:text-red-300">
                    {formatMoney(expense.amount)}
                  </TableCell>
                  <TableCell>{expense.transactionId}</TableCell>
                  <TableCell>{expense.cashier.username}</TableCell>
                  <TableCell>{formatDate(expense.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyTable />
      )}
    </div>
  );
}

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
} from "@/shadcn/components/ui/table";

import { apiClient } from "@/api-client";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { formatDate } from "@/utils/formatDate";
import { formatMoney } from "@/utils/formatMoney";

import { AddExpenseDialog } from "./-add-expense-dialog";

export const Route = createFileRoute("/orgs/$orgSlug/expenses/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.expenses"),
    icon: ShoppingCartIcon,
  }),
});

function RouteComponent() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();

  const { data: expenses } = useQuery({
    queryKey: ["expenses", orgSlug],
    queryFn: async () =>
      apiClient.getThrowing("/orgs/{orgSlug}/expenses", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

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
                <TableHead className="w-full">{t("common.form.description")}</TableHead>
                <TableHead>{t("common.form.price")}</TableHead>
                <TableHead>{t("cashierName")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense, index) => (
                <TableRow key={expense.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className={"text-red-500 dark:text-red-300"}>
                    {formatMoney(expense.amount)}
                  </TableCell>
                  <TableCell>{expense.cashierName}</TableCell>
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

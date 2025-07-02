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

import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

import { apiClient } from "../../api-client";
import { EmptyTable } from "../../components/empty-table";

export const Route = createFileRoute("/org/$orgSlug/expenses")({
  component: Expenses,
  context: () => ({
    title: i18n.t("pages.expenses"),
    icon: ShoppingCartIcon,
  }),
});

function Expenses() {
  const { slug: orgSlug } = useOrg();
  const { t, i18n } = useTranslation();

  const { data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () =>
      apiClient.get("/org/{orgSlug}/expense/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {expenses && expenses.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("description")}</TableHead>
                <TableHead>{t("moneyAmount")}</TableHead>
                <TableHead>{t("cashierName")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
                <TableHead>{t("updatedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(expenses ?? []).map((expense, index) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.price}</TableCell>
                  <TableCell>{expense.cashierName}</TableCell>
                  <TableCell>{new Date(expense.createdAt).toLocaleString(i18n.language)}</TableCell>
                  <TableCell>{new Date(expense.updatedAt).toLocaleString(i18n.language)}</TableCell>
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

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BanknoteIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";
import { cn } from "@/shadcn/lib/utils";

import { apiClient } from "@/api-client";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { formatDate } from "@/utils/formatDate";
import { formatMoney } from "@/utils/formatMoney";

export const Route = createFileRoute("/org/$orgSlug/transactions")({
  component: Transactions,
  context: () => ({
    title: i18n.t("routes.transactions"),
    icon: BanknoteIcon,
    roleRequirement: "ADMIN",
  }),
});

function Transactions() {
  const { slug: orgSlug } = useOrg();

  const { t, i18n } = useTranslation();

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/transaction/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {transactions?.length && transactions.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("transactionNumber")}</TableHead>
                <TableHead>{t("common.form.moneyAmount")}</TableHead>
                <TableHead>{t("common.form.username")}</TableHead>
                <TableHead>{t("customer.name")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "flex gap-2",
                        transaction.amount.includes("-") ? "text-red-300" : "text-green-300",
                      )}
                    >
                      {formatMoney(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.username}</TableCell>
                  <TableCell>{transaction.customerName}</TableCell>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
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

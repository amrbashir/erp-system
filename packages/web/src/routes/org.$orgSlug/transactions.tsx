import { formatCurrency } from "@erp-system/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpIcon, BanknoteIcon } from "lucide-react";
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
            <TableHeader>
              <TableRow className="*:font-bold">
                <TableHead>{t("transactionNumber")}</TableHead>
                <TableHead>{t("common.form.moneyAmount")}</TableHead>
                <TableHead>{t("common.form.username")}</TableHead>
                <TableHead>{t("customer.name")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions ?? []).map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>
                    <span className="flex gap-2">
                      <ArrowUpIcon
                        className={cn(
                          "-ms-8",
                          transaction.amount >= 0 ? "text-green-300" : "-scale-y-100 text-red-300",
                        )}
                      />
                      {formatCurrency(transaction.amount, "EGP", i18n.language)}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.username}</TableCell>
                  <TableCell>{transaction.customerName}</TableCell>
                  <TableCell>
                    {new Date(transaction.createdAt).toLocaleString(i18n.language)}
                  </TableCell>
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

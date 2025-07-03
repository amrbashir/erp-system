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

import { apiClient } from "@/api-client";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/transactions")({
  component: Transactions,
  context: () => ({
    title: i18n.t("pages.transactions"),
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
                <TableHead></TableHead>
                <TableHead>{t("moneyAmount")}</TableHead>
                <TableHead>{t("username")}</TableHead>
                <TableHead>{t("customerName")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions ?? []).map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
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

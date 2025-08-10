import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table.tsx";

import type { TransactionWithRelations } from "@erp-system/server/transaction/transaction.dto.ts";

import { EmptyTable } from "@/components/empty-table.tsx";
import { ButtonLink } from "@/components/ui/ButtonLink.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

export function TransactionsTable({
  transactions,
}: {
  transactions: TransactionWithRelations[] | undefined;
}) {
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

  return (
    <>
      {transactions?.length && transactions.length > 0 ? (
        <div className="rounded border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("transactionNumber")}</TableHead>
                <TableHead>{t("transaction.type")}</TableHead>
                <TableHead>{t("common.form.amount")}</TableHead>
                <TableHead>{t("invoice.number")}</TableHead>
                <TableHead>{t("cashierName")}</TableHead>
                <TableHead>{t("customer.name")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{t(`transaction.types.${transaction.type}`)}</TableCell>
                  <TableCell
                    className={
                      transaction.amount.isNegative()
                        ? "text-red-500 dark:text-red-300"
                        : "text-green-500 dark:text-green-300"
                    }
                  >
                    {formatMoney(transaction.amount, { signDisplay: "always" })}
                  </TableCell>
                  <TableCell>
                    {transaction.invoice?.id && (
                      <ButtonLink
                        variant="link"
                        to="/orgs/$orgSlug/invoices/$id"
                        params={{ id: transaction.invoice.id.toString(), orgSlug }}
                      >
                        {transaction.invoice.id}
                      </ButtonLink>
                    )}
                  </TableCell>
                  <TableCell>{transaction.cashier.username}</TableCell>
                  <TableCell>
                    {transaction.customer?.id ? (
                      <ButtonLink
                        variant="link"
                        to="/orgs/$orgSlug/customers/$id"
                        params={{ id: transaction.customer.id.toString(), orgSlug }}
                      >
                        {transaction.customer?.name}
                      </ButtonLink>
                    ) : (
                      transaction.customer?.name
                    )}
                  </TableCell>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyTable />
      )}
    </>
  );
}

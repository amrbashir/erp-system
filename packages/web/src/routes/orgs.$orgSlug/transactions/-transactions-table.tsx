import { Decimal } from "decimal.js";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";

import type { TransactionEntity } from "@erp-system/sdk/zod";
import type z from "zod";

import { EmptyTable } from "@/components/empty-table";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatDate } from "@/utils/formatDate";
import { formatMoney } from "@/utils/formatMoney";

type Transaction = z.infer<typeof TransactionEntity>;

export function TransactionsTable({ transactions }: { transactions: Transaction[] | undefined }) {
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
                      new Decimal(transaction.amount).isNegative()
                        ? "text-red-500 dark:text-red-300"
                        : "text-green-500 dark:text-green-300"
                    }
                  >
                    {formatMoney(transaction.amount, { signDisplay: "always" })}
                  </TableCell>
                  <TableCell>
                    {transaction.invoiceId && (
                      <ButtonLink
                        variant="link"
                        to="/orgs/$orgSlug/invoices/$id"
                        params={{ id: transaction.invoiceId.toString(), orgSlug }}
                      >
                        {transaction.invoiceId}
                      </ButtonLink>
                    )}
                  </TableCell>
                  <TableCell>{transaction.cashierUsername}</TableCell>
                  <TableCell>
                    {transaction.customerId ? (
                      <ButtonLink
                        variant="link"
                        to="/orgs/$orgSlug/customers/$id"
                        params={{ id: transaction.customerId.toString(), orgSlug }}
                      >
                        {transaction.customerName}
                      </ButtonLink>
                    ) : (
                      transaction.customerName
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

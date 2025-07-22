import { InvoiceEntity } from "@erp-system/sdk/zod";
import { useQuery } from "@tanstack/react-query";
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
import { cn } from "@/shadcn/lib/utils";

import type z from "zod";

import { apiClient } from "@/api-client";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";
import { formatDate } from "@/utils/formatDate";
import { formatMoney } from "@/utils/formatMoney";

type Invoice = z.infer<typeof InvoiceEntity>;

export function InvoicesTable({ invoices }: { invoices: Invoice[] | undefined }) {
  const { t } = useTranslation();

  return invoices?.length && invoices.length > 0 ? (
    <div className="rounded border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="*:font-bold">
            <TableHead>{t("invoice.number")}</TableHead>
            <TableHead>{t("invoice.type")}</TableHead>
            <TableHead>{t("cashierName")}</TableHead>
            <TableHead>{t("customer.name")}</TableHead>
            <TableHead>{t("common.dates.date")}</TableHead>
            <TableHead>{t("common.form.subtotal")}</TableHead>
            <TableHead>{t("common.form.discountPercent")}</TableHead>
            <TableHead>{t("common.form.discountAmount")}</TableHead>
            <TableHead>{t("common.form.total")}</TableHead>
            <TableHead>{t("common.form.paid")}</TableHead>
            <TableHead>{t("common.form.remaining")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice, index) => (
            <TableRow key={index}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell>{t(`invoice.types.${invoice.type}`)}</TableCell>
              <TableCell>{invoice.cashierName}</TableCell>
              <TableCell>{invoice.customerName}</TableCell>
              <TableCell>{formatDate(invoice.createdAt)}</TableCell>
              <TableCell>{formatMoney(invoice.subtotal)}</TableCell>
              <TableCell>{invoice.discountPercent}%</TableCell>
              <TableCell>{formatMoney(invoice.discountAmount)}</TableCell>
              <TableCell className="font-bold">{formatMoney(invoice.total)}</TableCell>
              <TableCell
                className={
                  invoice.type === "SALE"
                    ? "text-green-500 dark:text-green-300"
                    : "text-red-500 dark:text-red-300"
                }
              >
                {formatMoney(invoice.paid)}
              </TableCell>
              <TableCell
                className={cn(
                  new Decimal(invoice.remaining).greaterThan(0) && "text-red-500 dark:text-red-300",
                )}
              >
                {formatMoney(invoice.remaining)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ) : (
    <EmptyTable />
  );
}

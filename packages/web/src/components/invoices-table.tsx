import { InvoiceEntity } from "@erp-system/sdk/zod";
import { useQuery } from "@tanstack/react-query";
import { Decimal } from "decimal.js";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button";
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

type InvoiceType = z.infer<typeof InvoiceEntity>["type"];

export function InvoicesTable({ invoiceType }: { invoiceType: InvoiceType }) {
  const { t } = useTranslation();
  const { slug: orgSlug } = useOrg();

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/invoice/getAll", {
        params: {
          path: { orgSlug },
          query: { type: invoiceType },
        },
      }),
    select: (res) => res.data,
  });

  return invoices?.length && invoices.length > 0 ? (
    <div className="rounded border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="*:font-bold">
            <TableHead>{t("invoice.number")}</TableHead>
            <TableHead>{t("cashierName")}</TableHead>
            <TableHead>{t("customer.name")}</TableHead>
            <TableHead>{t("common.dates.date")}</TableHead>
            <TableHead>{t("invoice.subtotal")}</TableHead>
            <TableHead>{t("invoice.discountPercent")}</TableHead>
            <TableHead>{t("invoice.discountAmount")}</TableHead>
            <TableHead>{t("invoice.total")}</TableHead>
            <TableHead className="text-end!"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice, index) => (
            <InvoiceRow key={index} invoice={invoice} index={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  ) : (
    <EmptyTable />
  );
}

function InvoiceRow({
  invoice,
}: { invoice: z.infer<typeof InvoiceEntity>; index: number } & React.ComponentProps<"tr">) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className={open ? "bg-muted hover:bg-muted" : ""}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.cashierName}</TableCell>
        <TableCell>{invoice.customerName}</TableCell>
        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
        <TableCell>{formatMoney(invoice.subtotal)}</TableCell>
        <TableCell>{invoice.discountPercent}%</TableCell>
        <TableCell>{formatMoney(invoice.discountAmount)}</TableCell>
        <TableCell
          className={
            invoice.type === "SALE"
              ? "text-green-500 dark:text-green-300"
              : "text-red-500 dark:text-red-300"
          }
        >
          {formatMoney(
            invoice.type === "SALE" ? invoice.total : new Decimal(invoice.total).negated(),
            { signDisplay: "always" },
          )}
        </TableCell>
        <TableCell className="text-end!">
          <Button onClick={() => setOpen((prev) => !prev)} variant="ghost" size="sm">
            {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </TableCell>
      </TableRow>
      <TableRow className={cn("bg-muted/50", open ? "table-row" : "hidden")}>
        <TableCell colSpan={10} className="p-0!">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("common.ui.number")}</TableHead>
                <TableHead>{t("common.form.barcode")}</TableHead>
                <TableHead className="w-full">{t("common.form.description")}</TableHead>
                <TableHead>{t("common.form.quantity")}</TableHead>
                <TableHead>{t("common.form.price")}</TableHead>
                <TableHead>{t("invoice.subtotal")}</TableHead>
                <TableHead>{t("invoice.discountPercent")}</TableHead>
                <TableHead>{t("invoice.discountAmount")}</TableHead>
                <TableHead className="text-end!">{t("invoice.total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.barcode}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {formatMoney(invoice.type === "SALE" ? item.price : item.purchasePrice)}
                  </TableCell>
                  <TableCell>{formatMoney(item.subtotal)}</TableCell>
                  <TableCell>{item.discountPercent}%</TableCell>
                  <TableCell>{formatMoney(item.discountAmount)}</TableCell>
                  <TableCell className="text-end font-bold">{formatMoney(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCell>
      </TableRow>
    </>
  );
}

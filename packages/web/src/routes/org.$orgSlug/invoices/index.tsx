import { formatCurrency } from "@erp-system/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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

import type { InvoiceEntity } from "@erp-system/sdk/zod";
import type z from "zod";

import { apiClient } from "@/api-client";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";

export const Route = createFileRoute("/org/$orgSlug/invoices/")({ component: Invoices });

function Invoices() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const navigate = Route.useNavigate();

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/invoice/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <Button onClick={() => navigate({ to: "/org/$orgSlug/invoices/create" })}>
          {t("routes.createInvoice")}
        </Button>
      </div>

      {invoices?.length && invoices.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="*:font-bold">
                <TableHead>{t("invoice.number")}</TableHead>
                <TableHead>{t("cashierName")}</TableHead>
                <TableHead>{t("customer.name")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
                <TableHead>{t("common.dates.updatedAt")}</TableHead>
                <TableHead>{t("invoice.subtotal")}</TableHead>
                <TableHead>{t("invoice.discountPercent")}</TableHead>
                <TableHead>{t("invoice.discountAmount")}</TableHead>
                <TableHead>{t("invoice.total")}</TableHead>
                <TableHead className="text-end!"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoices ?? []).map((invoice, index) => (
                <InvoiceRow key={index} invoice={invoice} index={index} />
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

function InvoiceRow({
  invoice,
  index,
}: React.ComponentProps<"tr"> & { invoice: z.infer<typeof InvoiceEntity>; index: number }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className={open ? "bg-muted/50" : ""}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.cashierName}</TableCell>
        <TableCell>{invoice.customerName}</TableCell>
        <TableCell>{new Date(invoice.createdAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell>{new Date(invoice.updatedAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell>{formatCurrency(invoice.subtotal, "EGP", i18n.language)}</TableCell>
        <TableCell>{invoice.discount_percent}%</TableCell>
        <TableCell>{formatCurrency(invoice.discount_amount, "EGP", i18n.language)}</TableCell>
        <TableCell>{formatCurrency(invoice.total, "EGP", i18n.language)}</TableCell>
        <TableCell className="text-end!">
          <Button onClick={() => setOpen((prev) => !prev)} variant="ghost" size="sm">
            {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/50">
          <TableCell colSpan={10} className="pt-0">
            <Table>
              <TableHeader>
                <TableRow className="*:font-bold">
                  <TableHead>{t("common.ui.number")}</TableHead>
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
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {formatCurrency(item.selling_price, "EGP", i18n.language)}
                    </TableCell>
                    <TableCell>{formatCurrency(item.subtotal, "EGP", i18n.language)}</TableCell>
                    <TableCell>{item.discount_percent}%</TableCell>
                    <TableCell>
                      {formatCurrency(item.discount_amount, "EGP", i18n.language)}
                    </TableCell>
                    <TableCell className="text-end">
                      {formatCurrency(item.total, "EGP", i18n.language)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

import { InvoiceEntity } from "@erp-system/sdk/zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";

import type z from "zod";

import { apiClient } from "@/api-client";
import { EmptyTable } from "@/components/empty-table";
import { useFormatCurrency } from "@/hooks/format-currency";
import { useOrg } from "@/hooks/use-org";

export const Route = createFileRoute("/org/$orgSlug/invoices/")({
  component: Invoices,
});

type InvoiceType = z.infer<typeof InvoiceEntity>["type"];

function Invoices() {
  const { t } = useTranslation();
  const navigate = Route.useNavigate();

  return (
    <div className="p-4">
      <Tabs defaultValue="SALE">
        <div className="flex justify-between flex-row gap-2 flex-wrap-reverse">
          <TabsList>
            <TabsTrigger className="data-[state=active]:bg-background!" value="SALE">
              {t("invoice.types.sale")}
            </TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background!" value="PURCHASE">
              {t("invoice.types.purchase")}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button onClick={() => navigate({ to: "/org/$orgSlug/invoices/createSale" })}>
              {t("routes.createSaleInvoice")}
            </Button>
            <Button onClick={() => navigate({ to: "/org/$orgSlug/invoices/createPurchase" })}>
              {t("routes.createPurchaseInvoice")}
            </Button>
          </div>
        </div>
        <TabsContent value="SALE">
          <InvoiceList invoiceType="SALE" />
        </TabsContent>
        <TabsContent value="PURCHASE">
          <InvoiceList invoiceType="PURCHASE" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvoiceList({ invoiceType }: { invoiceType: InvoiceType }) {
  const { t } = useTranslation();
  const { slug: orgSlug } = useOrg();

  const { data: invoices } = useQuery({
    queryKey: ["invoices", invoiceType, orgSlug],
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
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
}: React.ComponentProps<"tr"> & { invoice: z.infer<typeof InvoiceEntity>; index: number }) {
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useFormatCurrency();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className={open ? "bg-muted hover:bg-muted" : ""}>
        <TableCell>{invoice.id}</TableCell>
        <TableCell>{invoice.cashierName}</TableCell>
        <TableCell>{invoice.customerName}</TableCell>
        <TableCell>{new Date(invoice.createdAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell>{new Date(invoice.updatedAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell>{formatCurrency(invoice.subtotal)}</TableCell>
        <TableCell>{invoice.discount_percent}%</TableCell>
        <TableCell>{formatCurrency(invoice.discount_amount)}</TableCell>
        <TableCell>{formatCurrency(invoice.total)}</TableCell>
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
                  <TableCell>{formatCurrency(item.selling_price)}</TableCell>
                  <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                  <TableCell>{item.discount_percent}%</TableCell>
                  <TableCell>{formatCurrency(item.discount_amount)}</TableCell>
                  <TableCell className="text-end">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCell>
      </TableRow>
    </>
  );
}

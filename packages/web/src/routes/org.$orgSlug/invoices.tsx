import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDownIcon, ChevronUpIcon, ReceiptTextIcon } from "lucide-react";
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
import i18n from "@/i18n";
import { useOrg } from "@/providers/org-provider";

export const Route = createFileRoute("/org/$orgSlug/invoices")({
  component: Invoices,
  context: () => ({
    title: i18n.t("pages.invoices"),
    icon: ReceiptTextIcon,
  }),
});

function Invoices() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () =>
      apiClient.get("/org/{orgSlug}/invoice/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {invoices?.length && invoices.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="*:font-bold">
                <TableHead></TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("cashierName")}</TableHead>
                <TableHead>{t("customerName")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
                <TableHead>{t("updatedAt")}</TableHead>
                <TableHead></TableHead>
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
        <TableCell>{index + 1}</TableCell>
        <TableCell>{invoice.total}</TableCell>
        <TableCell>{invoice.cashierName}</TableCell>
        <TableCell>{invoice.customerName}</TableCell>
        <TableCell>{new Date(invoice.createdAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell>{new Date(invoice.updatedAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell className="text-end">
          <Button onClick={() => setOpen((prev) => !prev)} variant="ghost" size="sm">
            {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/50">
          <TableCell colSpan={7} className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("purchasePrice")}</TableHead>
                  <TableHead>{t("sellingPrice")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.purchase_price}</TableCell>
                    <TableCell>{item.selling_price}</TableCell>
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

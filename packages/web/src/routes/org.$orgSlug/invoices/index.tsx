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
        <Button onClick={() => navigate({ to: "/org/$orgSlug/invoices/new" })}>
          {t("pages.createInvoice")}
        </Button>
      </div>

      {invoices?.length && invoices.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="*:font-bold">
                <TableHead>{t("cashierName")}</TableHead>
                <TableHead>{t("customerName")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
                <TableHead>{t("updatedAt")}</TableHead>
                <TableHead>{t("total")}</TableHead>
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
        <TableCell>{invoice.cashierName}</TableCell>
        <TableCell>{invoice.customerName}</TableCell>
        <TableCell>{new Date(invoice.createdAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell>{new Date(invoice.updatedAt).toLocaleString(i18n.language)}</TableCell>
        <TableCell>{invoice.total}</TableCell>
        <TableCell className="text-end!">
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
                  <TableHead>{}</TableHead>
                  <TableHead className="w-full">{t("description")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("sellingPrice")}</TableHead>
                  <TableHead className="text-end!">{t("total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.selling_price}</TableCell>
                    <TableCell className="text-end">{item.selling_price * item.quantity}</TableCell>
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

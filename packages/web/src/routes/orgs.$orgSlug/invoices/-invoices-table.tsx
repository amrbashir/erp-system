import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

import type { InvoiceWithRelations } from "@erp-system/server/invoice/invoice.dto.ts";

import { EmptyTable } from "@/components/empty-table.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

import { ButtonLink } from "../../../components/ui/button-link.tsx";

export function InvoicesTable({ invoices }: { invoices: InvoiceWithRelations[] | undefined }) {
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

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
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice, index) => (
            <TableRow key={index}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell>{t(`invoice.types.${invoice.type}`)}</TableCell>
              <TableCell>{invoice.cashier.username}</TableCell>
              <TableCell>{invoice.customer?.name}</TableCell>
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
                className={cn(invoice.remaining.greaterThan(0) && "text-red-500 dark:text-red-300")}
              >
                {formatMoney(invoice.remaining)}
              </TableCell>
              <TableCell className="text-end">
                <ButtonLink
                  variant="link"
                  to="/orgs/$orgSlug/invoices/$id"
                  params={{ id: invoice.id.toString(), orgSlug }}
                >
                  {t("common.actions.view")}
                </ButtonLink>
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

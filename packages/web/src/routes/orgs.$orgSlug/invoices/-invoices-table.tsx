import { createColumnHelper } from "@tanstack/react-table";
import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shadcn/lib/utils.ts";

import type { InvoiceWithRelations } from "@erp-system/server/invoice/invoice.dto.ts";

import { DataTable } from "@/components/ui/data-table.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

import { ButtonLink } from "../../../components/ui/button-link.tsx";

export function InvoicesTable({ invoices = [] }: { invoices: InvoiceWithRelations[] | undefined }) {
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

  const columnHelper = createColumnHelper<InvoiceWithRelations>();
  const columns = React.useMemo(
    () => [
      { accessorKey: "id", header: t("invoice.number") },
      columnHelper.accessor("type", {
        header: t("invoice.type"),
        cell: (info) => t(`invoice.types.${info.getValue()}`),
      }),
      { accessorKey: "cashier.username", header: t("cashierName") },
      {
        accessorKey: "customer.name",
        header: t("customer.name"),
      },
      columnHelper.accessor("createdAt", {
        header: t("common.dates.date"),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("subtotal", {
        header: t("common.form.subtotal"),
        cell: (info) => formatMoney(info.getValue()),
      }),
      columnHelper.accessor("discountPercent", {
        header: t("common.form.discountPercent"),
        cell: (info) => `${info.getValue()}%`,
      }),
      columnHelper.accessor("discountAmount", {
        header: t("common.form.discountAmount"),
        cell: (info) => formatMoney(info.getValue()),
      }),
      columnHelper.accessor("total", {
        header: t("common.form.total"),
        cell: (info) => <span className="font-bold">{formatMoney(info.getValue())}</span>,
      }),
      columnHelper.accessor("paid", {
        header: t("common.form.paid"),
        cell: ({ row }) => (
          <span
            className={
              row.original.type === "SALE"
                ? "text-green-500 dark:text-green-300"
                : "text-red-500 dark:text-red-300"
            }
          >
            {formatMoney(row.original.paid)}
          </span>
        ),
      }),
      columnHelper.accessor("remaining", {
        header: t("common.form.remaining"),
        cell: ({ row }) => (
          <span
            className={cn(
              row.original.remaining.greaterThan(0) && "text-red-500 dark:text-red-300",
            )}
          >
            {formatMoney(row.original.remaining)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        enableSorting: false,
        meta: { className: "text-end" },
        cell: ({ row }) => (
          <ButtonLink
            variant="link"
            to="/orgs/$orgSlug/invoices/$id"
            params={{ id: row.original.id.toString(), orgSlug }}
          >
            {t("common.actions.view")}
          </ButtonLink>
        ),
      }),
    ],
    [t, orgSlug],
  );

  return <DataTable columns={columns} data={invoices} />;
}

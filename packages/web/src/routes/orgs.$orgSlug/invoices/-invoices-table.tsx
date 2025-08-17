import { PaginatedOutput } from "@erp-system/server/dto/pagination.dto.ts";
import { createColumnHelper } from "@tanstack/react-table";
import { DecorateQueryProcedure } from "@trpc/tanstack-react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shadcn/lib/utils.ts";

import type { InvoiceWithRelations } from "@erp-system/server/invoice/invoice.dto.ts";

import { ButtonLink } from "@/components/ui/button-link.tsx";
import {
  DataTableServerPaginated,
  ServerPaginationParams,
} from "@/components/ui/data-table-server-paginated.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

interface InvoicesTableProps<TInput extends ServerPaginationParams> {
  input: TInput;
  procedure: DecorateQueryProcedure<{
    input: TInput;
    output: PaginatedOutput<InvoiceWithRelations[]>;
    transformer: true;
    // deno-lint-ignore no-explicit-any
    errorShape: any;
  }>;
}

export function InvoicesTable<TInput extends ServerPaginationParams>(
  props: InvoicesTableProps<TInput>,
) {
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

  const columnHelper = createColumnHelper<InvoiceWithRelations>();
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("invoice.number"),
      }),
      columnHelper.accessor("type", {
        header: t("invoice.type"),
        cell: (info) => t(`invoice.types.${info.getValue()}`),
      }),
      columnHelper.accessor("cashier.username", {
        header: t("cashierName"),
      }),
      columnHelper.accessor("customer.name", {
        header: t("customer.name"),
        cell: ({ row }) =>
          row.original.customer?.id ? (
            <ButtonLink
              variant="link"
              to="/orgs/$orgSlug/customers/$id"
              params={{ id: row.original.customer.id.toString(), orgSlug }}
            >
              {row.original.customer?.name}
            </ButtonLink>
          ) : (
            row.original.customer?.name
          ),
      }),
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

  return (
    <DataTableServerPaginated
      {...props}
      columns={columns}
      searchPlaceholder={t("invoice.search")}
    />
  );
}

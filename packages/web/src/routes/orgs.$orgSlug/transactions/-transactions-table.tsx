import { PaginatedOutput } from "@erp-system/server/dto/pagination.dto.ts";
import { createColumnHelper } from "@tanstack/react-table";
import { DecorateQueryProcedure } from "@trpc/tanstack-react-query";
import React from "react";
import { useTranslation } from "react-i18next";

import type { TransactionWithRelations } from "@erp-system/server/transaction/transaction.dto.ts";
import type { ParseKeys } from "i18next";

import { ButtonLink } from "@/components/ui/button-link.tsx";
import {
  DataTableServerPaginated,
  ServerPaginationParams,
} from "@/components/ui/data-table-server-paginated.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

interface TransactionsTableProps<TInput extends ServerPaginationParams> {
  input: TInput;
  procedure: DecorateQueryProcedure<{
    input: TInput;
    output: PaginatedOutput<TransactionWithRelations[]>;
    transformer: true;
    // deno-lint-ignore no-explicit-any
    errorShape: any;
  }>;
}

export function TransactionsTable<TInput extends ServerPaginationParams>(
  props: TransactionsTableProps<TInput>,
) {
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

  const columnHelper = createColumnHelper<TransactionWithRelations>();
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("transactionNumber"),
      }),
      columnHelper.accessor("type", {
        header: t("transaction.type"),
        cell: (info) => t(`transaction.types.${info.getValue()}` as ParseKeys),
      }),
      columnHelper.accessor("amount", {
        header: t("common.form.amount"),
        cell: ({ row }) => (
          <span
            className={
              row.original.amount.isNegative()
                ? "text-red-500 dark:text-red-300"
                : "text-green-500 dark:text-green-300"
            }
          >
            {formatMoney(row.original.amount, { signDisplay: "always" })}
          </span>
        ),
      }),
      columnHelper.accessor("invoice.id", {
        header: t("invoice.number"),
        cell: ({ row }) =>
          row.original.invoice?.id ? (
            <ButtonLink
              variant="link"
              to="/orgs/$orgSlug/invoices/$id"
              params={{ id: row.original.invoice.id.toString(), orgSlug }}
            >
              {row.original.invoice.id}
            </ButtonLink>
          ) : null,
      }),
      columnHelper.accessor("cashier.username", {
        header: t("cashierName"),
      }),
      columnHelper.accessor("customer.name", {
        id: "customerName",
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
        header: t("common.dates.createdAt"),
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [orgSlug, t],
  );

  return (
    <DataTableServerPaginated
      {...props}
      columns={columns}
      searchPlaceholder={t("transaction.search")}
    />
  );
}

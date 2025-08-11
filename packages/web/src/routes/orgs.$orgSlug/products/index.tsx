import { Product } from "@erp-system/server/prisma";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { PackageIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { ActionsDropdownMenu } from "@/components/actions-dropdown.tsx";
import { DataTable } from "@/components/ui/data-table.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

import { ButtonLink } from "../../../components/ui/button-link.tsx";
import { EditProductDialog } from "./-edit-product-dialog.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/products/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.products"),
    icon: PackageIcon,
  }),
});

function RouteComponent() {
  const { orgSlug } = useAuthUser();

  const { t } = useTranslation();

  const { data: products = [] } = useQuery(trpc.orgs.products.getAll.queryOptions({ orgSlug }));

  const columnHelper = createColumnHelper<Product>();
  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "index",
        header: t("common.ui.number"),
        cell: (info) => info.row.index + 1,
      }),
      {
        accessorKey: "stockQuantity",
        header: t("common.form.quantity"),
      },
      {
        accessorKey: "barcode",
        header: t("common.form.barcode"),
      },
      {
        accessorKey: "description",
        header: t("common.form.description"),
      },
      columnHelper.accessor("purchasePrice", {
        header: t("common.pricing.purchase"),
        cell: (info) => (
          <span className="text-red-500 dark:text-red-300">{formatMoney(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor("sellingPrice", {
        header: t("common.pricing.selling"),
        cell: (info) => (
          <span className="text-green-500 dark:text-green-300">{formatMoney(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: t("common.dates.createdAt"),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.display({
        id: "actions",
        enableSorting: false,
        meta: { className: "text-end" },
        cell: ({ row }) => (
          <ActionsDropdownMenu
            actions={[
              { Component: <EditProductDialog product={row.original} asMenuItem shortLabel /> },
            ]}
          />
        ),
      }),
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <ButtonLink to="/orgs/$orgSlug/invoices/createPurchase" params={{ orgSlug }}>
          {i18n.t("routes.invoice.createPurchase")}
        </ButtonLink>
      </div>

      <DataTable columns={columns} data={products} />
    </div>
  );
}

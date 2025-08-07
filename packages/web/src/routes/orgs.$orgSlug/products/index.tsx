import { ActionsDropdownMenu } from "@/components/actions-dropdown.tsx";
import { EmptyTable } from "@/components/empty-table.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PackageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table.tsx";

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

  const { data: products } = useQuery(trpc.orgs.products.getAll.queryOptions({ orgSlug }));

  return (
    <div className="flex flex-col gap-4 p-4">
      {products?.length && products.length > 0 ? (
        <div className="rounded border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("common.ui.number")}</TableHead>
                <TableHead>{t("common.form.quantity")}</TableHead>
                <TableHead>{t("common.form.barcode")}</TableHead>
                <TableHead>{t("common.form.description")}</TableHead>
                <TableHead>{t("common.pricing.purchase")}</TableHead>
                <TableHead>{t("common.pricing.selling")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{product.stockQuantity}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell className="text-red-500 dark:text-red-300">
                    {formatMoney(product.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-green-500 dark:text-green-300">
                    {formatMoney(product.sellingPrice)}
                  </TableCell>
                  <TableCell>{formatDate(product.createdAt)}</TableCell>
                  <TableCell className="text-end">
                    <ActionsDropdownMenu
                      actions={[{ Component: <EditProductDialog product={product} asMenuItem /> }]}
                    />
                  </TableCell>
                </TableRow>
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

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
} from "@/shadcn/components/ui/table";

import { apiClient } from "@/api-client";
import { EmptyTable } from "@/components/empty-table";
import { ProductDialog } from "@/components/product-dialog";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { formatDate } from "@/utils/formatDate";
import { formatMoney } from "@/utils/formatMoney";

export const Route = createFileRoute("/org/$orgSlug/products")({
  component: Products,
  context: () => ({
    title: i18n.t("routes.products"),
    icon: PackageIcon,
  }),
});

function Products() {
  const { slug: orgSlug } = useOrg();

  const { t } = useTranslation();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/product/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

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
                <TableHead className="min-w-[50%]">{t("common.form.description")}</TableHead>
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
                  <TableCell>
                    <ProductDialog action="edit" product={product} iconOnly />
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

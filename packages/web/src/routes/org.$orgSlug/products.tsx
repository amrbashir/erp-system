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
import { useFormatCurrency } from "@/hooks/format-currency";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/products")({
  component: Products,
  context: () => ({
    title: i18n.t("routes.products"),
    icon: PackageIcon,
  }),
});

function Products() {
  const { slug: orgSlug } = useOrg();

  const { t, i18n } = useTranslation();
  const { formatCurrency } = useFormatCurrency();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/product/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {products?.length && products.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="*:font-bold">
                <TableHead>{t("common.ui.number")}</TableHead>
                <TableHead>{t("common.form.quantity")}</TableHead>
                <TableHead className="min-w-[50%]">{t("common.form.description")}</TableHead>
                <TableHead>{t("common.pricing.purchase")}</TableHead>
                <TableHead>{t("common.pricing.selling")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
                <TableHead>{t("common.dates.updatedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{formatCurrency(product.purchase_price)}</TableCell>
                  <TableCell>{formatCurrency(product.selling_price)}</TableCell>
                  <TableCell>{new Date(product.createdAt).toLocaleString(i18n.language)}</TableCell>
                  <TableCell>{new Date(product.updatedAt).toLocaleString(i18n.language)}</TableCell>
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

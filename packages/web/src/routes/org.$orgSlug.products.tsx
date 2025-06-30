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
import i18n from "@/i18n";
import { useOrg } from "@/providers/org-provider";

export const Route = createFileRoute("/org/$orgSlug/products")({
  component: Products,
  context: () => ({
    title: i18n.t("pages.products"),
    icon: PackageIcon,
  }),
});

function Products() {
  const { slug: orgSlug } = useOrg();

  const { t, i18n } = useTranslation();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () =>
      apiClient.get("/org/{orgSlug}/product/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <main className="p-4 flex flex-col gap-4">
      <div className="rounded-lg overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="text-start font-bold">{t("quantity")}</TableHead>
              <TableHead className="text-start font-bold">{t("description")}</TableHead>
              <TableHead className="text-start font-bold">{t("purchasePrice")}</TableHead>
              <TableHead className="text-start font-bold">{t("sellingPrice")}</TableHead>
              <TableHead className="text-start font-bold">{t("createdAt")}</TableHead>
              <TableHead className="text-start font-bold">{t("updatedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(products ?? []).map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.stock_quantity}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>{product.purchase_price}</TableCell>
                <TableCell>{product.selling_price}</TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleString(i18n.language)}</TableCell>
                <TableCell>{new Date(product.updatedAt).toLocaleString(i18n.language)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}

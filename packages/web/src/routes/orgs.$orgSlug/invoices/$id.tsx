import i18n from "@/i18n.ts";
import { trpcClient } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";
import { formatMoney } from "@/utils/formatMoney.ts";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/components/ui/card.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

export const Route = createFileRoute("/orgs/$orgSlug/invoices/$id")({
  component: RouteComponent,
  context: ({ params }) => ({
    title: i18n.t("routes.invoiceDetails") + " #" + params.id,
  }),
  loader: ({ params }) =>
    trpcClient.orgs.invoices.getById.query({ orgSlug: params.orgSlug, id: +params.id }),
});

function RouteComponent() {
  const invoice = Route.useLoaderData();
  const { t } = useTranslation();

  if (!invoice) return null;

  return (
    <div className="p-4 gap-4 flex flex-col">
      <Card>
        <CardHeader>
          <CardTitle>
            {t("routes.invoiceDetails")} # {invoice.id}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody className="border *:*:not-last:border-e *:*:odd:bg-muted *:*:even:w-[25%]">
              <TableRow>
                <TableCell>{t("invoice.number")}</TableCell>
                <TableCell colSpan={3}>{invoice.id}</TableCell>
                <TableCell>{t("transactionNumber")}</TableCell>
                <TableCell colSpan={3}>{invoice.transactionId}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("cashierName")}</TableCell>
                <TableCell colSpan={3}>{invoice.cashier.username}</TableCell>
                <TableCell>{t("customer.name")}</TableCell>
                <TableCell colSpan={3}>{invoice.customer?.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("common.dates.createdAt")}</TableCell>
                <TableCell colSpan={7}>{formatDate(invoice.createdAt)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("common.form.subtotal")}</TableCell>
                <TableCell className="font-semibold">{formatMoney(invoice.subtotal)}</TableCell>
                <TableCell>{t("common.form.discountPercent")}</TableCell>
                <TableCell>{invoice.discountPercent}</TableCell>
                <TableCell>{t("common.form.discountAmount")}</TableCell>
                <TableCell>{formatMoney(invoice.discountAmount)}</TableCell>
                <TableCell>{t("common.form.total")}</TableCell>
                <TableCell className="font-bold">{formatMoney(invoice.total)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("common.form.paid")}</TableCell>
                <TableCell
                  colSpan={3}
                  className={cn(
                    invoice.paid.greaterThan(0) &&
                      (invoice.type === "SALE"
                        ? "text-green-500 dark:text-green-300"
                        : "text-red-500 dark:text-red-300"),
                  )}
                >
                  {formatMoney(invoice.paid)}
                </TableCell>
                <TableCell>{t("common.form.remaining")}</TableCell>
                <TableCell
                  colSpan={3}
                  className={cn(
                    invoice.remaining.greaterThan(0) &&
                      (invoice.type === "SALE"
                        ? "text-red-500 dark:text-red-300"
                        : "text-blue-500 dark:text-blue-300"),
                  )}
                >
                  {formatMoney(invoice.remaining)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="rounded border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="*:font-bold">
              <TableHead>{t("common.ui.number")}</TableHead>
              <TableHead>{t("common.form.barcode")}</TableHead>
              <TableHead>{t("common.form.description")}</TableHead>
              <TableHead>{t("common.form.price")}</TableHead>
              <TableHead>{t("common.form.quantity")}</TableHead>
              <TableHead>{t("common.form.discountPercent")}</TableHead>
              <TableHead>{t("common.form.discountAmount")}</TableHead>
              <TableHead>{t("common.form.subtotal")}</TableHead>
              <TableHead>{t("common.form.total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{formatMoney(item.price)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.discountPercent}%</TableCell>
                <TableCell>{formatMoney(item.discountAmount)}</TableCell>
                <TableCell>{formatMoney(item.subtotal)}</TableCell>
                <TableCell className="font-medium">{formatMoney(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

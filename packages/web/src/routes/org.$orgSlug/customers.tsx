import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";
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
import { AddCustomerDialog } from "@/components/add-customer-dialog";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/customers")({
  component: Customers,
  context: () => ({
    title: i18n.t("routes.customers"),
    icon: UserIcon,
  }),
});

function Customers() {
  const { slug: orgSlug } = useOrg();

  const { t, i18n } = useTranslation();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/customer/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <AddCustomerDialog />
      </div>

      {customers?.length && customers.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("customer.id")}</TableHead>
                <TableHead className="min-w-[50%]">{t("common.form.name")}</TableHead>
                <TableHead>{t("common.form.address")}</TableHead>
                <TableHead>{t("common.form.phone")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.address}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{new Date(customer.createdAt).toLocaleString()}</TableCell>
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

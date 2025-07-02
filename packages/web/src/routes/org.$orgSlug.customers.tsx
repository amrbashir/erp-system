import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";
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
import i18n from "@/i18n";
import { useOrg } from "@/providers/org-provider";

export const Route = createFileRoute("/org/$orgSlug/customers")({
  component: Customers,
  context: () => ({
    title: i18n.t("pages.customers"),
    icon: UsersIcon,
  }),
});

function Customers() {
  const { slug: orgSlug } = useOrg();

  const { t, i18n } = useTranslation();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () =>
      apiClient.get("/org/{orgSlug}/customer/getAll", { params: { path: { orgSlug } } }),
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
            <TableHeader>
              <TableRow className="*:font-bold">
                <TableHead></TableHead>
                <TableHead className="min-w-[50%]">{t("name")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
                <TableHead>{t("updatedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(customers ?? []).map((customer, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    {new Date(customer.createdAt).toLocaleString(i18n.language)}
                  </TableCell>
                  <TableCell>
                    {new Date(customer.updatedAt).toLocaleString(i18n.language)}
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

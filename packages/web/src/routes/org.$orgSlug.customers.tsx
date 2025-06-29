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
    <main className="p-4">
      <div className="rounded-lg overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="text-start font-bold">{t("name")}</TableHead>
              <TableHead className="text-start font-bold">{t("email")}</TableHead>
              <TableHead className="text-start font-bold">{t("phone")}</TableHead>
              <TableHead className="text-start font-bold">{t("createdAt")}</TableHead>
              <TableHead className="text-start font-bold">{t("updatedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(customers ?? []).map((customer) => (
              <TableRow key={customer.name}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{new Date(customer.createdAt).toLocaleString(i18n.language)}</TableCell>
                <TableCell>{new Date(customer.updatedAt).toLocaleString(i18n.language)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}

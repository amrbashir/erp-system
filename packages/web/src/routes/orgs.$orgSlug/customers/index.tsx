import { EmptyTable } from "@/components/empty-table.tsx";
import { ButtonLink } from "@/components/ui/ButtonLink.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";
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
} from "@/shadcn/components/ui/table.tsx";

import { CustomerDialog } from "./-customer-dialog.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/customers/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.customers"),
    icon: UserIcon,
  }),
});

function RouteComponent() {
  const { orgSlug } = useAuthUser();

  const { t } = useTranslation();

  const { data: customers } = useQuery(trpc.orgs.customers.getAll.queryOptions({ orgSlug }));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <CustomerDialog action="create" />
      </div>

      {customers?.length && customers.length > 0 ? (
        <div className="rounded border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("customer.id")}</TableHead>
                <TableHead>{t("common.form.name")}</TableHead>
                <TableHead>{t("common.form.address")}</TableHead>
                <TableHead>{t("common.form.phone")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.address}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell className="text-end">
                    <ButtonLink
                      variant="link"
                      to="/orgs/$orgSlug/customers/$id"
                      params={{ id: customer.id.toString(), orgSlug }}
                    >
                      {t("common.actions.view")}
                    </ButtonLink>
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

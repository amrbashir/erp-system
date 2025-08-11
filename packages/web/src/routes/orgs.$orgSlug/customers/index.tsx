import { Customer } from "@erp-system/server/prisma";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { UserIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/ui/data-table.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";

import { ButtonLink } from "../../../components/ui/button-link.tsx";
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

  const { data: customers = [] } = useQuery(trpc.orgs.customers.getAll.queryOptions({ orgSlug }));

  const columnHelper = createColumnHelper<Customer>();
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("customer.id"),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: t("common.form.name"),
      },
      {
        accessorKey: "address",
        header: t("common.form.address"),
      },
      {
        accessorKey: "phone",
        header: t("common.form.phone"),
      },
      columnHelper.accessor("createdAt", {
        header: t("common.dates.createdAt"),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.display({
        id: "actions",
        meta: {
          className: "text-end",
        },
        header: () => null,
        cell: ({ row }) => (
          <ButtonLink
            variant="link"
            to="/orgs/$orgSlug/customers/$id"
            params={{ id: row.original.id.toString(), orgSlug }}
          >
            {t("common.actions.view")}
          </ButtonLink>
        ),
      }),
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <CustomerDialog action="create" />
      </div>

      <DataTable columns={columns} data={customers} />
    </div>
  );
}

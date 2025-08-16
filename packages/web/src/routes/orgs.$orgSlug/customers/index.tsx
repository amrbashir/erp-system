import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { UserIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { ButtonLink } from "@/components/ui/button-link.tsx";
import { DataTableServerPaginated } from "@/components/ui/data-table-server-paginated.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";

import { CustomerDialog } from "./-customer-dialog.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/customers/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.customers"),
    icon: UserIcon,
  }),
});

const procedure = trpc.orgs.customers.getAll;
const columnHelper = createColumnHelper<(typeof procedure)["~types"]["output"]["data"][number]>();

function RouteComponent() {
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("customer.id"),
      }),
      columnHelper.accessor("name", {
        header: t("common.form.name"),
      }),
      columnHelper.accessor("address", {
        header: t("common.form.address"),
      }),
      columnHelper.accessor("phone", {
        header: t("common.form.phone"),
      }),
      columnHelper.accessor("createdAt", {
        header: t("common.dates.createdAt"),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.display({
        id: "actions",
        enableSorting: false,
        meta: { className: "text-end" },
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

      <DataTableServerPaginated procedure={procedure} input={{ orgSlug }} columns={columns} />
    </div>
  );
}

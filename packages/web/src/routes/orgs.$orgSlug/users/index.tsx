import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { UsersIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { ParseKeys } from "i18next";

import { ActionsDropdownMenu } from "@/components/actions-dropdown.tsx";
import { DataTableServerPaginated } from "@/components/ui/data-table-server-paginated.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";

import { AddUserDialog } from "./-add-user-dialog.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/users/")({
  component: RouteComponent,
  context: () => ({ title: i18n.t("routes.users"), icon: UsersIcon, roleRequirement: "ADMIN" }),
});

const procedure = trpc.orgs.users.getAll;
const columnHelper = createColumnHelper<(typeof procedure)["~types"]["output"]["data"][number]>();

function RouteComponent() {
  const { orgSlug } = useAuthUser();
  const { t } = useTranslation();
  const client = useQueryClient();

  const {
    isPending: isUserDeletePending,
    variables: deleteVars,
    mutateAsync: deleteUser,
  } = useMutation(
    trpc.orgs.users.delete.mutationOptions({
      onSuccess: () => client.invalidateQueries({ queryKey: trpc.orgs.users.getAll.queryKey() }),
      onError: (error) => toast.error(t(`errors.${error.message}` as ParseKeys)),
    }),
  );
  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "index",
        header: t("common.ui.number"),
        cell: (info) => info.row.index + 1,
      }),
      {
        accessorKey: "username",
        header: t("common.form.username"),
      },
      {
        accessorKey: "role",
        header: t("common.form.role"),
      },
      columnHelper.accessor("createdAt", {
        header: t("common.dates.createdAt"),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("deletedAt", {
        header: t("common.dates.deletedAt"),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.display({
        id: "actions",
        meta: { className: "text-end" },
        cell: ({ row: { original: user } }) => {
          return (
            <div className="text-end">
              <ActionsDropdownMenu
                actions={[
                  {
                    label: t("common.actions.delete"),
                    onAction: () => deleteUser({ orgSlug, userId: user.id }),
                    pending: deleteVars?.userId === user.id && isUserDeletePending,
                    disabled: !!user.deletedAt,
                    confirm: true,
                    confirmMessage: t("user.deleteDescription", { username: user.username }),
                    variant: "destructive",
                  },
                ]}
              />
            </div>
          );
        },
      }),
    ],
    [deleteUser, isUserDeletePending, orgSlug, t, deleteVars],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <AddUserDialog />
      </div>

      <DataTableServerPaginated
        procedure={procedure}
        input={{ orgSlug }}
        columns={columns}
        searchPlaceholder={t("user.search")}
      />
    </div>
  );
}

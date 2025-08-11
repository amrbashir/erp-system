import { User } from "@erp-system/server/prisma";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { UsersIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { ParseKeys } from "i18next";

import { ActionsDropdownMenu } from "@/components/actions-dropdown.tsx";
import { DataTable } from "@/components/ui/data-table.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatDate } from "@/utils/formatDate.ts";

import { AddUserDialog } from "./-add-user-dialog.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/users/")({
  component: RouteComponent,
  context: () => ({ title: i18n.t("routes.users"), icon: UsersIcon, roleRequirement: "ADMIN" }),
});

function RouteComponent() {
  const { orgSlug } = useAuthUser();
  const { t } = useTranslation();

  const { data: users = [], refetch: refetchUsers } = useQuery(
    trpc.orgs.users.getAll.queryOptions({ orgSlug }),
  );

  const {
    isPending: isUserDeletePending,
    variables: deleteVars,
    mutateAsync: deleteUser,
  } = useMutation(
    trpc.orgs.users.delete.mutationOptions({
      onSuccess: () => refetchUsers(),
      onError: (error) => toast.error(t(`errors.${error.message}` as ParseKeys)),
    }),
  );
  const columnHelper = createColumnHelper<User>();
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
        enableSorting: false,
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

      <DataTable columns={columns} data={users} />
    </div>
  );
}

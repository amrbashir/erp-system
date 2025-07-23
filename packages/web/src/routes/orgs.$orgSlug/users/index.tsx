import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";
import { cn } from "@/shadcn/lib/utils";

import { apiClient } from "@/api-client";
import { ActionsDropdownMenu } from "@/components/actions-dropdown";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { useAuth } from "@/providers/auth";
import { formatDate } from "@/utils/formatDate";

import { AddUserDialog } from "./-add-user-dialog";

export const Route = createFileRoute("/orgs/$orgSlug/users/")({
  component: RouteComponent,
  context: () => ({ title: i18n.t("routes.users"), icon: UsersIcon, roleRequirement: "ADMIN" }),
});

function RouteComponent() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users", orgSlug, user?.role],
    queryFn: async () =>
      apiClient.getThrowing("/orgs/{orgSlug}/users", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  const {
    isPending: isUserDeletePending,
    variables: deleteId,
    mutateAsync: deleteUser,
  } = useMutation({
    mutationFn: async (id: string) =>
      await apiClient.deleteThrowing("/orgs/{orgSlug}/users/{id}", {
        params: { path: { orgSlug, id } },
      }),
    onSuccess: () => refetchUsers(),
    onError: (error) => toast.error(t(`errors.${error.message}` as any)),
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <AddUserDialog />
      </div>

      {users?.length && users.length > 0 ? (
        <div className="rounded border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="*:font-bold">
                <TableHead>{t("common.ui.number")}</TableHead>
                <TableHead>{t("common.form.username")}</TableHead>
                <TableHead>{t("user.role")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
                <TableHead>{t("common.dates.deletedAt")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index} className={cn(user.deletedAt && "text-muted-foreground")}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{t(`user.roles.${user.role}`)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.deletedAt)}</TableCell>
                  <TableCell className="text-end">
                    <ActionsDropdownMenu
                      actions={[
                        {
                          label: t("common.actions.delete"),
                          onAction: () => deleteUser(user.id),
                          pending: deleteId === user.id && isUserDeletePending,
                          disabled: !!user.deletedAt,
                          confirm: true,
                          confirmMessage: t("user.deleteDescription", { username: user.username }),
                          variant: "destructive",
                        },
                      ]}
                    />
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

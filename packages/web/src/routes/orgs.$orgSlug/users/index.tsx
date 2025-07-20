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

  const { data: users } = useQuery({
    queryKey: ["users", orgSlug, user?.role],
    queryFn: async () =>
      apiClient.getThrowing("/orgs/{orgSlug}/users", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
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
                <TableHead className="w-full">{t("common.form.username")}</TableHead>
                <TableHead>{t("user.role")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow
                  key={index}
                  className={user.deletedAt ? "line-through text-muted-foreground" : ""}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{t(`user.roles.${user.role}`)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
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

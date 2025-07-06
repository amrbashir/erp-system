import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EllipsisVerticalIcon, Loader2Icon, UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shadcn/components/ui/alert-dialog";
import { Button } from "@/shadcn/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";

import type { DeleteUserDto } from "@erp-system/sdk/zod";
import type z from "zod";

import { apiClient } from "@/api-client";
import { AddUserDialog } from "@/components/add-user-dialog";
import { EmptyTable } from "@/components/empty-table";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { useAuth } from "@/providers/auth";

export const Route = createFileRoute("/org/$orgSlug/users")({
  component: Users,
  context: () => ({ title: i18n.t("routes.users"), icon: UsersIcon, roleRequirement: "ADMIN" }),
});

function Users() {
  const { slug: orgSlug } = useOrg();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users", user?.username],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/user/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  const {
    isPending: isUserDeletePending,
    variables: deleteVariables,
    mutateAsync: deleteUser,
  } = useMutation({
    mutationFn: async (body: z.infer<typeof DeleteUserDto>) =>
      await apiClient.deleteThrowing("/org/{orgSlug}/user/delete", {
        params: { path: { orgSlug } },
        body,
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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="*:font-bold">
                <TableHead>{t("common.ui.number")}</TableHead>
                <TableHead className="min-w-[50%]">{t("common.form.username")}</TableHead>
                <TableHead>{t("user.role")}</TableHead>
                <TableHead>{t("common.dates.createdAt")}</TableHead>
                <TableHead>{t("common.dates.updatedAt")}</TableHead>
                <TableHead>{t("common.dates.deletedAt")}</TableHead>
                <TableHead></TableHead>
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
                  <TableCell>{new Date(user.createdAt).toLocaleString(i18n.language)}</TableCell>
                  <TableCell>{new Date(user.updatedAt).toLocaleString(i18n.language)}</TableCell>
                  <TableCell>
                    {user.deletedAt ? new Date(user.deletedAt).toLocaleString(i18n.language) : ""}
                  </TableCell>
                  <TableCell className="text-end">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="text-muted-foreground hover:text-primary"
                          asChild
                        >
                          <Button variant="ghost" size="sm">
                            {isUserDeletePending && deleteVariables.username === user.username ? (
                              <Loader2Icon className="animate-spin" />
                            ) : (
                              <EllipsisVerticalIcon />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem disabled={!!user.deletedAt} variant="destructive">
                              {t("common.actions.delete")}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("common.ui.areYouSure")}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>
                          {t("user.deleteDescription", { username: user.username })}
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUser(user)}>
                            {t("common.actions.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

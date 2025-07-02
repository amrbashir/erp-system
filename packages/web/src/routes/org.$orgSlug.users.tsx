import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EllipsisVerticalIcon, Loader2Icon, UsersIcon } from "lucide-react";
import { useEffect } from "react";
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
import i18n from "@/i18n";
import { useAuth } from "@/providers/auth-provider";
import { useOrg } from "@/providers/org-provider";

export const Route = createFileRoute("/org/$orgSlug/users")({
  component: Users,
  context: () => ({ title: i18n.t("pages.users"), icon: UsersIcon, roleRequirement: "Admin" }),
});

function Users() {
  const { slug: orgSlug } = useOrg();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users", user?.username],
    queryFn: async () =>
      apiClient.get("/org/{orgSlug}/user/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  const {
    isPending: isUserDeletePending,
    variables: deleteVariables,
    mutateAsync: deleteUser,
  } = useMutation({
    mutationFn: async (body: z.infer<typeof DeleteUserDto>) => {
      const { data, error } = await apiClient.delete("/org/{orgSlug}/user/delete", {
        body,
        params: { path: { orgSlug } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => refetchUsers(),
    onError: (error) => toast.error(t(`errors.${error.message}` as any)),
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <AddUserDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="*:font-bold">
              <TableHead></TableHead>
              <TableHead className="min-w-[50%]">{t("username")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("createdAt")}</TableHead>
              <TableHead>{t("updatedAt")}</TableHead>
              <TableHead>{t("deletedAt")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((user, index) => (
              <TableRow
                key={index}
                className={user.deletedAt ? "line-through text-muted-foreground" : ""}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{t(`roles.${user.role}`)}</TableCell>
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
                            {t("delete")}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("areYouSure")}</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogDescription>
                        {t("deleteUserDescription", { username: user.username })}
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(user)}>
                          {t("delete")}
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
    </div>
  );
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ContactIcon, EllipsisVerticalIcon, Loader2Icon } from "lucide-react";
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
  context: () => ({ title: i18n.t("pages.users"), icon: ContactIcon, roleRequirement: "Admin" }),
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
    error: deleteError,
    isPending: isUserDeletePending,
    variables: deleteVariables,
    mutateAsync: deleteUser,
  } = useMutation({
    mutationFn: async (body: z.infer<typeof DeleteUserDto>) =>
      apiClient.delete("/org/{orgSlug}/user/delete", { body, params: { path: { orgSlug } } }),
    onSuccess: () => refetchUsers(),
  });

  useEffect(() => {
    if (deleteError) toast.error(t(`errors.${deleteError.message}` as any));
  }, [deleteError, t]);

  return (
    <main className="p-4 flex flex-col gap-4">
      <div>
        <AddUserDialog />
      </div>

      <div className="rounded-lg overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="text-start font-bold">{t("username")}</TableHead>
              <TableHead className="text-start font-bold">{t("role")}</TableHead>
              <TableHead className="text-start font-bold">{t("createdAt")}</TableHead>
              <TableHead className="text-start font-bold">{t("updatedAt")}</TableHead>
              <TableHead className="text-start font-bold">{t("deletedAt")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((user) => (
              <TableRow
                key={user.username}
                className={user.deletedAt ? "line-through text-muted-foreground" : ""}
              >
                <TableCell>{user.username}</TableCell>
                <TableCell>{t(`roles.${user.role}`)}</TableCell>
                <TableCell>{toLocaleString(user.createdAt, i18n.language)}</TableCell>
                <TableCell>{toLocaleString(user.updatedAt, i18n.language)}</TableCell>
                <TableCell>
                  {user.deletedAt ? toLocaleString(user.deletedAt, i18n.language) : ""}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="text-muted-foreground hover:text-primary"
                        asChild
                      >
                        {isUserDeletePending && deleteVariables.username === user.username ? (
                          <Loader2Icon className="animate-spin" />
                        ) : (
                          <EllipsisVerticalIcon />
                        )}
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
    </main>
  );
}

function toLocaleString(date: string, lang: string) {
  return new Date(date).toLocaleString(lang);
}

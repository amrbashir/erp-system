import { apiRequest } from "@/api-client";
import { AddUserDialog } from "@/components/add-user";
import i18n from "@/i18n";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { CreateUserDto, DeleteUserDto } from "@tech-zone-store/sdk/zod";
import { ContactIcon, EllipsisVerticalIcon, Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type z from "zod";

export const Route = createFileRoute("/users")({
  component: Users,
  context: () => ({ title: i18n.t("pages.users"), icon: ContactIcon, requirement: "Admin" }),
});

function Users() {
  const { t, i18n } = useTranslation();

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () =>
      apiRequest("post", "/user/getAll", {
        body: { organization: "tech-zone" },
      }),
    select: (res) => res.data,
  });

  const {
    error: deleteError,
    isPending: isUserDeletePending,
    variables: deleteVariables,
    mutateAsync: deleteUser,
  } = useMutation({
    mutationFn: async (body: z.infer<typeof DeleteUserDto>) =>
      apiRequest("delete", "/user/delete", { body }),
    onSuccess: () => refetchUsers(),
  });

  useEffect(() => {
    if (deleteError) toast.error(t(`errors.${deleteError.message}` as any));
  }, [deleteError, t]);

  return (
    <main className="flex flex-col gap-4">
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
                      <DropdownMenuItem
                        disabled={!!user.deletedAt}
                        variant="destructive"
                        onSelect={() =>
                          deleteUser({ username: user.username, organization: "tech-zone" })
                        }
                      >
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
  switch (lang) {
    case "ar":
      lang = "ar-EG"; // Arabic (Egypt)
      break;
    case "en":
      lang = "en-GB"; // English (United Kingdom)
      break;
  }

  return new Date(date).toLocaleString(lang);
}

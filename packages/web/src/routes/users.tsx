import { apiClient } from "@/api-client";
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
import { ContactIcon, EllipsisVerticalIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const Route = createFileRoute("/users")({
  component: Users,
  context: () => ({ title: i18n.t("pages.users"), icon: ContactIcon, requirement: "Admin" }),
});

function Users() {
  const { t, i18n } = useTranslation();

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await apiClient.request("get", "/user/getAll");
      if (error) throw error;
      return data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await apiClient.request("delete", "/user/delete", {
        body: { username, organization: "tech-zone" },
      });
      if (error) {
        toast.error(t(`errors.${(error as any).message}` as any));
        throw error;
      }
      return data;
    },
    onSuccess: () => refetchUsers(),
  });

  return (
    <main>
      <div className="rounded-lg overflow-hidden border">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="text-start font-bold">{t("username")}</TableHead>
              <TableHead className="text-start font-bold">{t("role")}</TableHead>
              <TableHead className="text-start font-bold">{t("createdAt")}</TableHead>
              <TableHead className="text-start font-bold">{t("updatedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((user) => (
              <TableRow key={user.username}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{t(`roles.${user.role}`)}</TableCell>
                <TableCell>{toLocaleString(user.createdAt, i18n.language)}</TableCell>
                <TableCell>{toLocaleString(user.updatedAt, i18n.language)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="text-muted-foreground hover:text-primary"
                      asChild
                    >
                      <EllipsisVerticalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => deleteUserMutation.mutate(user.username)}
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

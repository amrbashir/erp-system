import { apiClient } from "@/api-client";
import i18n from "@/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ContactIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/users")({
  component: Users,
  context: () => ({ title: i18n.t("pages.users"), icon: ContactIcon, requirement: "Admin" }),
});

function Users() {
  const { t, i18n } = useTranslation();

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await apiClient.request("get", "/user/getAll");
      if (error) throw error;
      return data;
    },
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

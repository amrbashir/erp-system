import i18n from "@/i18n.ts";
import { createFileRoute } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";

export const Route = createFileRoute("/orgs/$orgSlug/customers")({
  context: () => ({
    title: i18n.t("routes.customers"),
    icon: UserIcon,
  }),
});

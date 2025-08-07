import { createFileRoute } from "@tanstack/react-router";
import { UsersIcon } from "lucide-react";

import i18n from "@/i18n.ts";

export const Route = createFileRoute("/orgs/$orgSlug/users")({
  context: () => ({
    title: i18n.t("routes.users"),
    icon: UsersIcon,
    roleRequirement: "ADMIN",
  }),
});

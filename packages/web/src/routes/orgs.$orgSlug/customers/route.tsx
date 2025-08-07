import { createFileRoute } from "@tanstack/react-router";
import { UserIcon } from "lucide-react";

import i18n from "@/i18n.ts";

export const Route = createFileRoute("/orgs/$orgSlug/customers")({
  context: () => ({
    title: i18n.t("routes.customers"),
    icon: UserIcon,
  }),
});

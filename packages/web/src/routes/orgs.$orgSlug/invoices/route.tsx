import { createFileRoute } from "@tanstack/react-router";
import { FileTextIcon } from "lucide-react";

import i18n from "@/i18n";

export const Route = createFileRoute("/orgs/$orgSlug/invoices")({
  context: () => ({
    title: i18n.t("routes.invoices"),
    icon: FileTextIcon,
  }),
});

import { createFileRoute } from "@tanstack/react-router";
import { ReceiptTextIcon } from "lucide-react";

import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/invoices")({
  context: () => ({
    title: i18n.t("routes.invoices"),
    icon: ReceiptTextIcon,
  }),
});

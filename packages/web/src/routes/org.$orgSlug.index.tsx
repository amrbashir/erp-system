import { createFileRoute } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import i18n from "@/i18n";
import { useOrg } from "@/providers/org-provider";

export const Route = createFileRoute("/org/$orgSlug/")({
  component: Index,
  context: () => ({
    title: i18n.t("pages.home"),
    icon: HomeIcon,
  }),
});

function Index() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();

  return (
    <main className="flex-1 flex flex-col items-center justify-center">
      <HomeIcon className="w-50 h-50 mb-10 opacity-5" />
      <h1 className="text-3xl font-semibold text-center">{t("welcomeToErpOrg", { orgSlug })}</h1>
      <p className="text-lg text-center mt-2 text-gray-400">{t("welcomeToErpDescription")}</p>
    </main>
  );
}

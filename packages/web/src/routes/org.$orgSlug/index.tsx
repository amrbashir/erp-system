import { createFileRoute } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/")({
  component: Index,
  context: () => ({
    title: i18n.t("routes.home"),
    icon: HomeIcon,
  }),
});

function Index() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <HomeIcon className="w-50 h-50 mb-10 text-muted-foreground opacity-50" />
      <h1 className="text-3xl font-semibold text-center text-muted-foreground">
        {t("welcomeToErpOrg", { orgSlug })}
      </h1>
      <p className="text-lg text-center mt-2 text-muted-foreground">
        {t("welcomeToErpDescription")}
      </p>
    </div>
  );
}

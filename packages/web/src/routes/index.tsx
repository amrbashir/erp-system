import { createFileRoute } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: Index,
  loader: () => ({ title: i18n.t("pages.home"), icon: HomeIcon }),
});

function Index() {
  const { t } = useTranslation("translation");
  return <div>Welcome to {t("pages.home")}!</div>;
}

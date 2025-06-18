import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({
  component: Index,
  loader: () => ({ title: i18n.t("home"), icon: Home }),
});

function Index() {
  const { t } = useTranslation("translation");
  return <div>Welcome to {t("home")}!</div>;
}

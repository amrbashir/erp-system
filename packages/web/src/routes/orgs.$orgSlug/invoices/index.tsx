import { createFileRoute } from "@tanstack/react-router";
import { FileTextIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { QuickActionLinkCardProps } from "@/components/quick-action-link-card.tsx";
import { QuickActionLinkCard } from "@/components/quick-action-link-card.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";

export const Route = createFileRoute("/orgs/$orgSlug/invoices/")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoices"),
    icon: FileTextIcon,
  }),
});

function RouteComponent() {
  const { orgName } = useAuthUser();
  const { t } = useTranslation();

  const quickActions: QuickActionLinkCardProps[] = [
    {
      title: t("routes.invoice.createSale"),
      icon: FileTextIcon,
      to: "/orgs/$orgSlug/invoices/createSale",
      hoverBgColor: "hover:bg-green-50 dark:hover:bg-green-950/50",
      iconColor: "text-green-500",
      iconBgColor: "bg-green-100 dark:bg-green-950/50",
      size: "sm",
    },
    {
      title: t("routes.invoice.createPurchase"),
      icon: FileTextIcon,
      to: "/orgs/$orgSlug/invoices/createPurchase",
      hoverBgColor: "hover:bg-rose-50 dark:hover:bg-rose-950/50",
      iconColor: "text-rose-500",
      iconBgColor: "bg-rose-100 dark:bg-rose-950/50",
      size: "sm",
    },
    {
      title: t("routes.invoice.sale"),
      icon: FileTextIcon,
      to: "/orgs/$orgSlug/invoices/sales",
      hoverBgColor: "hover:bg-cyan-50 dark:hover:bg-lime-950/50",
      iconColor: "text-lime-500",
      iconBgColor: "bg-lime-100 dark:bg-lime-950/50",
    },
    {
      title: t("routes.invoice.purchase"),
      icon: FileTextIcon,
      to: "/orgs/$orgSlug/invoices/purchases",
      hoverBgColor: "hover:bg-amber-50 dark:hover:bg-amber-950/50",
      iconColor: "text-amber-500",
      iconBgColor: "bg-amber-100 dark:bg-amber-950/50",
    },
  ];

  return (
    <div className="mt-20 h-full flex flex-col items-center p-4 gap-4">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-semibold text-center text-muted-foreground">
          {t("welcomeToErpOrg", { orgName })}
        </h1>
        <p className="text-lg text-center mt-2 text-muted-foreground">
          {t("welcomeToErpDescription")}
        </p>
      </div>

      <div className="w-full md:w-auto grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <QuickActionLinkCard
            key={index}
            {...action}
            className={
              action.size === "sm" ? "col-span-2 md:col-span-1" : "col-span-2 md:col-span-1"
            }
          />
        ))}
      </div>
    </div>
  );
}

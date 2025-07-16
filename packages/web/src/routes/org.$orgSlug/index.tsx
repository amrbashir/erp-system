import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BanknoteIcon,
  FileTextIcon,
  HomeIcon,
  PackageIcon,
  ShoppingCartIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shadcn/components/ui/separator";

import type { QuickActionLinkCardProps } from "@/components/quick-action-link-card";
import { QuickActionLinkCard } from "@/components/quick-action-link-card";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { useAuth } from "@/providers/auth";

export const Route = createFileRoute("/org/$orgSlug/")({
  component: Index,
  context: () => ({
    title: i18n.t("routes.home"),
    icon: HomeIcon,
  }),
});

function Index() {
  const { slug: orgSlug, name: orgName } = useOrg();
  const { user } = useAuth();
  const { t } = useTranslation();

  const miniQuickActions: QuickActionLinkCardProps[] = [
    {
      title: t("routes.invoice.createSale"),
      icon: FileTextIcon,
      to: `/org/${orgSlug}/invoices/createSale`,
      hoverBgColor: "hover:bg-green-50 dark:hover:bg-green-950/50",
      iconColor: "text-green-500",
      iconBgColor: "bg-green-100 dark:bg-green-950/50",
      size: "sm",
    },
    {
      title: t("routes.invoice.createPurchase"),
      icon: FileTextIcon,
      to: `/org/${orgSlug}/invoices/createPurchase`,
      hoverBgColor: "hover:bg-rose-50 dark:hover:bg-rose-950/50",
      iconColor: "text-rose-500",
      iconBgColor: "bg-rose-100 dark:bg-rose-950/50",
      size: "sm",
    },
  ];

  const quickActions: QuickActionLinkCardProps[] = [
    {
      title: t("routes.invoices"),
      icon: FileTextIcon,
      to: `/org/${orgSlug}/invoices`,
      hoverBgColor: "hover:bg-cyan-50 dark:hover:bg-cyan-950/50",
      iconColor: "text-cyan-500",
      iconBgColor: "bg-cyan-100 dark:bg-cyan-950/50",
    },
    {
      title: t("routes.products"),
      icon: PackageIcon,
      to: `/org/${orgSlug}/products`,
      hoverBgColor: "hover:bg-blue-50 dark:hover:bg-blue-950/50",
      iconColor: "text-blue-500",
      iconBgColor: "bg-blue-100 dark:bg-blue-950/50",
    },
    {
      title: t("routes.expenses"),
      icon: ShoppingCartIcon,
      to: `/org/${orgSlug}/expenses`,
      hoverBgColor: "hover:bg-orange-50 dark:hover:bg-orange-950/50",
      iconColor: "text-orange-500",
      iconBgColor: "bg-orange-100 dark:bg-orange-950/50",
    },
    {
      title: t("routes.customers"),
      icon: UserIcon,
      to: `/org/${orgSlug}/customers`,
      hoverBgColor: "hover:bg-indigo-50 dark:hover:bg-indigo-950/50",
      iconColor: "text-indigo-500",
      iconBgColor: "bg-indigo-100 dark:bg-indigo-950/50",
    },
  ];

  const adminQuickActions: QuickActionLinkCardProps[] =
    user?.role === "ADMIN"
      ? [
          {
            title: t("routes.transactions"),
            icon: BanknoteIcon,
            to: `/org/${orgSlug}/transactions`,
            hoverBgColor: "hover:bg-teal-50 dark:hover:bg-teal-950/50",
            iconColor: "text-teal-500",
            iconBgColor: "bg-teal-100 dark:bg-teal-950/50",
          },
          {
            title: t("routes.users"),
            icon: UsersIcon,
            to: `/org/${orgSlug}/users`,
            hoverBgColor: "hover:bg-lime-50 dark:hover:bg-lime-950/50",
            iconColor: "text-lime-500",
            iconBgColor: "bg-lime-100 dark:bg-lime-950/50",
          },
        ]
      : [];

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

      <div className="w-full md:w-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        {miniQuickActions.map((action, index) => (
          <QuickActionLinkCard key={index} {...action} className="col-span-1" />
        ))}

        <div className="hidden lg:block lg:col-span-1" />
        <div className="hidden lg:block lg:col-span-1" />

        {quickActions.map((action, index) => (
          <QuickActionLinkCard key={index} {...action} className="col-span-2 md:col-span-1" />
        ))}

        <Separator className="col-span-2 lg:col-span-4" />

        {adminQuickActions.map((action, index) => (
          <QuickActionLinkCard key={index} {...action} className="col-span-2 md:col-span-1" />
        ))}
      </div>
    </div>
  );
}

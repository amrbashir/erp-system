import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BanknoteIcon,
  FileTextIcon,
  HomeIcon,
  PackageIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shadcn/components/ui/card";

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

  const quickActions = [
    {
      title: t("routes.createSaleInvoice"),
      icon: FileTextIcon,
      path: `/org/${orgSlug}/invoices/createSale`,
      color: "text-purple-500",
      bgColor: "bg-purple-100 dark:bg-purple-950/50",
    },
    {
      title: t("routes.createPurchaseInvoice"),
      icon: FileTextIcon,
      path: `/org/${orgSlug}/invoices/createPurchase`,
      color: "text-indigo-500",
      bgColor: "bg-indigo-100 dark:bg-indigo-950/50",
    },
    {
      title: t("routes.products"),
      icon: PackageIcon,
      path: `/org/${orgSlug}/products`,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-950/50",
    },
    {
      title: t("routes.expenses"),
      icon: ShoppingCartIcon,
      path: `/org/${orgSlug}/expenses`,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-950/50",
    },
    {
      title: t("routes.customers"),
      icon: UserIcon,
      path: `/org/${orgSlug}/customers`,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-950/50",
    },
  ];

  const adminQuickActions =
    user?.role === "ADMIN"
      ? [
          {
            title: t("routes.transactions"),
            icon: BanknoteIcon,
            path: `/org/${orgSlug}/transactions`,
            color: "text-emerald-500",
            bgColor: "bg-emerald-100 dark:bg-emerald-950/50",
          },
        ]
      : [];

  return (
    <div className="flex flex-col items-center h-full p-4 gap-8">
      <div className="text-center mb-4">
        <HomeIcon className="w-20 h-20 mb-6 text-muted-foreground opacity-50 mx-auto" />
        <h1 className="text-3xl font-semibold text-center text-muted-foreground">
          {t("welcomeToErpOrg", { orgName })}
        </h1>
        <p className="text-lg text-center mt-2 text-muted-foreground">
          {t("welcomeToErpDescription")}
        </p>
      </div>

      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...quickActions, ...adminQuickActions].map((action) => (
            <Link key={action.path} to={action.path} className="no-underline">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className={`p-3 rounded-full w-fit ${action.bgColor}`}>
                    <action.icon className={action.color} />
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

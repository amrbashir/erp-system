import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/shadcn/components/ui/button";

import { apiClient } from "@/api-client";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

import { InvoicesTable } from "./-invoices-table";

export const Route = createFileRoute("/orgs/$orgSlug/invoices/purchases")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.purchase"),
  }),
});

function RouteComponent() {
  const { slug: orgSlug } = useOrg();

  const { data: invoices } = useQuery({
    queryKey: ["invoices", orgSlug, "PURCHASE"],
    queryFn: async () =>
      apiClient.getThrowing("/orgs/{orgSlug}/invoices", {
        params: {
          path: { orgSlug },
          query: { type: "PURCHASE" },
        },
      }),
    select: (res) => res.data,
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <Button asChild>
          <Link to="/orgs/$orgSlug/invoices/createPurchase" params={{ orgSlug }}>
            <PlusIcon />
            {i18n.t("routes.invoice.createPurchase")}
          </Link>
        </Button>
      </div>

      <InvoicesTable invoices={invoices} />
    </div>
  );
}

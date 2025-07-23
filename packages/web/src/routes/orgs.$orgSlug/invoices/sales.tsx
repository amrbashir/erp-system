import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/shadcn/components/ui/button";

import { apiClient } from "@/api-client";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

import { InvoicesTable } from "./-invoices-table";

export const Route = createFileRoute("/orgs/$orgSlug/invoices/sales")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.sale"),
  }),
});

function RouteComponent() {
  const { slug: orgSlug } = useOrg();

  const { data: invoices } = useQuery({
    queryKey: ["invoices", orgSlug, "SALE"],
    queryFn: async () =>
      apiClient.getThrowing("/orgs/{orgSlug}/invoices", {
        params: {
          path: { orgSlug },
          query: { type: "SALE" },
        },
      }),
    select: (res) => res.data,
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <ButtonLink to="/orgs/$orgSlug/invoices/createSale" params={{ orgSlug }}>
          <PlusIcon />
          {i18n.t("routes.invoice.createSale")}
        </ButtonLink>
      </div>

      <InvoicesTable invoices={invoices} />
    </div>
  );
}

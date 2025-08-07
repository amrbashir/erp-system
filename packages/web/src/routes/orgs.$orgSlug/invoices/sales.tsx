import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { ButtonLink } from "@/components/ui/ButtonLink.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";

import { InvoicesTable } from "./-invoices-table.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/invoices/sales")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.sale"),
  }),
});

function RouteComponent() {
  const { orgSlug } = useAuthUser();

  const { data: invoices } = useQuery(
    trpc.orgs.invoices.getAll.queryOptions({ orgSlug, type: "SALE" }),
  );

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

import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/shadcn/components/ui/button";

import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

import { InvoicesTable } from "./-invoices-table";

export const Route = createFileRoute("/org/$orgSlug/invoices/purchases")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.purchase"),
  }),
});

function RouteComponent() {
  const { slug: orgSlug } = useOrg();

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <Button asChild>
          <Link to="/org/$orgSlug/invoices/createPurchase" params={{ orgSlug }}>
            <PlusIcon />
            {i18n.t("routes.invoice.createPurchase")}
          </Link>
        </Button>
      </div>

      <InvoicesTable invoiceType="PURCHASE" />
    </div>
  );
}

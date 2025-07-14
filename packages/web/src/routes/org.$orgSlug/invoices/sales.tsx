import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Button } from "@/shadcn/components/ui/button";

import { InvoicesTable } from "@/components/invoices-table";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/invoices/sales")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.sale"),
  }),
});

function RouteComponent() {
  const { slug: orgSlug } = useOrg();

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <Button asChild>
          <Link to="/org/$orgSlug/invoices/createSale" params={{ orgSlug }}>
            <PlusIcon />
            {i18n.t("routes.invoice.createSale")}
          </Link>
        </Button>
      </div>

      <InvoicesTable invoiceType="SALE" />
    </div>
  );
}

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableRow } from "@/shadcn/components/ui/table.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/components/ui/tabs.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

import type { CustomerWithDetails } from "@erp-system/server/dto";

import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { InvoicesTable } from "@/routes/orgs.$orgSlug/invoices/-invoices-table.tsx";
import { TransactionsTable } from "@/routes/orgs.$orgSlug/transactions/-transactions-table.tsx";
import { trpcClient } from "@/trpc.ts";
import { formatMoney } from "@/utils/formatMoney.ts";

import { CustomerDialog } from "./-customer-dialog.tsx";
import { PayOrCollectMoneyDialog } from "./-pay-or-collect-money-dialog.tsx";

function fetchCustomerDetails(params: { id: number; orgSlug: string }) {
  const paramsCustoemrId = { customerId: params.id, orgSlug: params.orgSlug };

  return Promise.all([
    trpcClient.orgs.customers.getById.query(paramsCustoemrId),
    trpcClient.orgs.invoices.getByCustomerId.query(paramsCustoemrId),
    trpcClient.orgs.transactions.getByCustomerId.query(paramsCustoemrId),
  ]);
}

export const Route = createFileRoute("/orgs/$orgSlug/customers/$id")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.customerDetails"),
  }),
  loader: async ({ params, context, route }) => {
    const details = await fetchCustomerDetails({ id: +params.id, orgSlug: params.orgSlug });

    // Set the page title based on the customer's name if available
    if (details[0]?.name) {
      const customerName = details[0].name;
      context.title = customerName;

      route.update({
        head: (c) => {
          const orgSlug = "orgSlug" in c.params && c.params.orgSlug ? c.params.orgSlug : "";
          const title = [customerName, i18n.t("routes.customerDetails"), orgSlug, "erp-system"]
            .filter(Boolean)
            .join(" | ");

          return {
            meta: [{ title }],
          };
        },
      });
    }

    return details;
  },
});

function RouteComponent() {
  const { t } = useTranslation();

  const [customer, invoices, transactions] = Route.useLoaderData();

  if (!customer) return null;

  return (
    <div className="p-4 flex flex-col gap-4">
      <CustomerInfoCard customer={customer} />

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">{t("routes.invoices")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("routes.transactions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesTable invoices={invoices} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <TransactionsTable transactions={transactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomerInfoCard({ customer }: { customer: CustomerWithDetails }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { orgSlug } = useAuthUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="text-base font-normal">{t("customer.name")}</span>:{" "}
          <span className="text-3xl">{customer.name}</span>
        </CardTitle>
        <CardAction className="flex flex-col md:flex-row gap-2">
          <PayOrCollectMoneyDialog action="collect" customerId={customer.id} />
          <PayOrCollectMoneyDialog action="pay" customerId={customer.id} />
          <CustomerDialog
            action="edit"
            shortLabel
            customer={customer}
            onEdited={() =>
              router.invalidate({
                filter: (r) => r.id === `/orgs/${orgSlug}/customers/${customer.id}`,
              })
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody className="border *:*:not-last:border-e *:*:odd:bg-muted *:*:even:w-[50%]">
            <TableRow>
              <TableCell>{t("customer.id")}</TableCell>
              <TableCell>{customer.id}</TableCell>
              <TableCell>{t("common.form.balance")}</TableCell>
              <TableCell
                className={cn(
                  customer.details?.balance.isNegative()
                    ? "text-red-500 dark:text-red-300"
                    : "text-green-500 dark:text-green-300",
                )}
              >
                {formatMoney(customer.details?.balance ?? 0, { signDisplay: "exceptZero" })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("common.form.address")}</TableCell>
              <TableCell>{customer.address}</TableCell>
              <TableCell>{t("common.form.phone")}</TableCell>
              <TableCell>{customer.phone}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

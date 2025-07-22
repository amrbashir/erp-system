import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Decimal } from "decimal.js";
import { useTranslation } from "react-i18next";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shadcn/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/shadcn/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";

import type { CustomerEntity } from "@erp-system/sdk/zod";
import type z from "zod";

import { apiClient } from "@/api-client";
import i18n from "@/i18n";

import { InvoicesTable } from "../invoices/-invoices-table";
import { TransactionsTable } from "../transactions/-transactions-table";
import { CustomerDialog } from "./-customer-dialog";

type Customer = z.infer<typeof CustomerEntity>;

async function fetchCustomerDetails(params: { id: number; orgSlug: string }) {
  const paramsCustoemrId = { customerId: params.id, orgSlug: params.orgSlug };

  return Promise.all([
    apiClient.getThrowing("/orgs/{orgSlug}/customers/{id}", { params: { path: params } }),
    apiClient.getThrowing("/orgs/{orgSlug}/invoices/customer/{customerId}", {
      params: { path: paramsCustoemrId },
    }),
    apiClient.getThrowing("/orgs/{orgSlug}/transactions/customer/{customerId}", {
      params: { path: paramsCustoemrId },
    }),
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
    if (details[0].data?.name) {
      const customerName = details[0].data.name;
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
  const [{ data: customer }, { data: invoices }, { data: transactions }] = Route.useLoaderData();
  const { t } = useTranslation();

  return (
    <div className="p-4 flex flex-col gap-4">
      <CustomerInfoCard customer={customer as Customer} />

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

function CustomerInfoCard({ customer }: { customer: Customer }) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("routes.customerDetails")}</CardTitle>
        <CardAction>
          <CustomerDialog
            action="edit"
            shortLabel
            customer={customer}
            onEdited={() => router.invalidate()}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody className="border *:*:not-last:border-e *:*:odd:bg-muted *:*:even:w-[50%]">
            <TableRow>
              <TableCell>{t("customer.name")}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{t("customer.id")}</TableCell>
              <TableCell>{customer.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("common.form.address")}</TableCell>
              <TableCell>{customer.address}</TableCell>
              <TableCell>{t("common.form.phone")}</TableCell>
              <TableCell>{customer.phone}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{t("customer.amountReceivable")}</TableCell>
              <TableCell
                className={cn(
                  new Decimal(customer.details?.amountReceivable ?? 0).greaterThan(0) &&
                    "text-red-500 dark:text-red-300",
                )}
              >
                {customer.details?.amountReceivable}
              </TableCell>
              <TableCell>{t("customer.amountPayable")}</TableCell>
              <TableCell
                className={cn(
                  new Decimal(customer.details?.amountReceivable ?? 0).greaterThan(0) &&
                    "text-red-500 dark:text-red-300",
                )}
              >
                {customer.details?.amountPayable}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import { CreatePurchaseInvoiceDto } from "@erp-system/server/invoice/invoice.dto.ts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ParseKeys } from "i18next";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table.tsx";

import type z from "zod";

import { ErrorElement } from "@/components/error-element.tsx";
import { Hotkey } from "@/components/ui/hotkey.tsx";
import { InputNumpad } from "@/components/ui/input-numpad.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import i18n from "@/i18n.ts";
import { trpc } from "@/trpc.ts";
import { formatMoney } from "@/utils/formatMoney.ts";
import {
  calculateInvoiceSubtotal,
  calculateInvoiceTotal,
  calculateItemDiscount,
  calculateItemSubtotal,
  calculateItemTotal,
} from "@/utils/invoice-calculator.ts";
import { SafeDecimal } from "@/utils/SafeDecimal.ts";

import { InvoiceFooter } from "./-create-invoice-footer.tsx";
import { CustomerSelector } from "./-customer-selector.tsx";
import { ProductSelector } from "./-product-selector.tsx";

export const Route = createFileRoute("/orgs/$orgSlug/invoices/createPurchase")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.createPurchase"),
  }),
});

const DEFAULT_INVOICE_ITEM = {
  productId: undefined,
  barcode: "",
  description: "",
  quantity: 1,
  purchasePrice: "0",
  sellingPrice: "0",
  discountPercent: 0,
  discountAmount: "0",
};

function RouteComponent() {
  const { orgSlug } = useAuthUser();
  const { t } = useTranslation();
  const client = useQueryClient();

  const { data: products } = useQuery(trpc.orgs.products.getAll.queryOptions({ orgSlug }));
  const { data: customers } = useQuery(trpc.orgs.customers.getAll.queryOptions({ orgSlug }));

  // Create lookup maps for faster product retrieval
  const productsByBarcode = React.useMemo(
    () => new Map(products?.map((product) => [product.barcode, product])),
    [products],
  );
  const productsByBarcodeArray = React.useMemo(
    () => Array.from(productsByBarcode.keys()).filter((b) => b !== undefined && b !== null),
    [products],
  );
  const productsByDescription = React.useMemo(
    () => new Map(products?.map((product) => [product.description, product])),
    [products],
  );
  const productsByDescriptionArray = React.useMemo(
    () => Array.from(productsByDescription.keys()),
    [productsByDescription],
  );

  const {
    mutateAsync: createPurchaseInvoice,
    isError: createPurchaseInvoiceIsError,
    error: createPurchaseInvoiceError,
  } = useMutation(trpc.orgs.invoices.createPurchase.mutationOptions());

  const form = useForm({
    defaultValues: {
      items: [{ ...DEFAULT_INVOICE_ITEM }],
      customerId: undefined,
      discountPercent: 0,
      discountAmount: "0",
      paid: "0",
    } as z.input<typeof CreatePurchaseInvoiceDto>,
    validators: {
      onChange: ({ value, formApi }) => {
        const paidField = formApi.getFieldMeta("paid");

        // If the paid field is dirty, we don't want to auto-update it
        if (paidField?.isDirty) return;

        const total = calculateInvoiceTotal(
          calculateInvoiceSubtotal(value.items, "PURCHASE"),
          value.discountPercent,
          value.discountAmount,
        );
        formApi.setFieldValue("paid", total.toString(), { dontUpdateMeta: true });
      },

      onSubmit: CreatePurchaseInvoiceDto,
    },
    onSubmitInvalid({ formApi }) {
      formApi.state.errors
        .filter((e) => !!e)
        .map((error) => Object.values(error))
        .flat()
        .flat()
        .forEach((error) => {
          // error.message might contain a namespace separator `:`,
          // so we use a different separator as we don't care about namespaces here
          toast.error(t(`errors.${error.message}` as ParseKeys, { nsSeparator: "`" }));
        });
    },
    onSubmit: async ({ value: { items, ...value }, formApi }) => {
      await createPurchaseInvoice({
        ...value,
        orgSlug,
        items: items.filter((item) => !!item.productId || !!item.barcode || !!item.description),
      });

      if (createPurchaseInvoiceIsError) return;

      toast.success(t("invoice.createdSuccessfully"));
      client.invalidateQueries({ queryKey: ["invoices", orgSlug, "PURCHASE"] });
      formApi.reset();
    },
  });

  const InvoiceHeader = () => (
    <div className="h-fit flex flex-col md:flex-row md:justify-between gap-2">
      <form.Field
        name="customerId"
        children={(field) => (
          <CustomerSelector
            customers={customers}
            name={field.name}
            value={field.state.value}
            onChange={(value) => field.handleChange(value)}
          />
        )}
      />

      <div className="flex gap-2 justify-end *:flex-1 md:*:flex-none">
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <>
              <Button
                type="button"
                disabled={isSubmitting}
                variant="secondary"
                onClick={() => form.reset()}
              >
                <Hotkey hotkey="F7" onHotkey={() => form.reset()} />
                {t("common.actions.delete")}
              </Button>
              <Button disabled={isSubmitting}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                <Hotkey hotkey="F8" onHotkey={() => form.handleSubmit()} />
                {t("common.actions.create")}
              </Button>
            </>
          )}
        />
      </div>
    </div>
  );

  const InvoiceTableHeader = () => (
    <TableHeader className="sticky top-0 z-10">
      <TableRow className="*:font-bold">
        <TableHead></TableHead>
        <TableHead>{t("common.ui.number")}</TableHead>
        <TableHead className="min-w-3xs">{t("common.form.barcode")}</TableHead>
        <TableHead className="min-w-3xs">{t("common.form.description")}</TableHead>
        <TableHead className="w-40">{t("common.form.quantity")}</TableHead>
        <TableHead className="w-40">{t("common.pricing.purchase")}</TableHead>
        <TableHead className="w-40">{t("common.pricing.selling")}</TableHead>
        <TableHead>{t("common.form.subtotal")}</TableHead>
        <TableHead className="w-40">{t("common.form.discountPercent")}</TableHead>
        <TableHead></TableHead>
        <TableHead className="w-40">{t("common.form.discountAmount")}</TableHead>
        <TableHead>{t("common.form.total")}</TableHead>
      </TableRow>
    </TableHeader>
  );

  const ResetItemButton = (props: React.ComponentProps<typeof Button>) => (
    <Button
      type="button"
      variant="ghost"
      className="w-9 rounded-none text-red-500 dark:text-red-300"
      {...props}
    >
      <XIcon className="size-4" />
    </Button>
  );

  const InvoiceTableRow = ({ index, onRemoveRow }: { index: number; onRemoveRow: () => void }) => {
    return (
      <form.Field
        name={`items[${index}]`}
        children={(itemField) => {
          const item = itemField.state.value;
          const itemSubtotal = calculateItemSubtotal(item.purchasePrice, item.quantity);
          const { percentDiscount } = calculateItemDiscount(
            itemSubtotal,
            item.discountPercent,
            item.discountAmount,
          );
          const itemTotal = calculateItemTotal(
            item.purchasePrice,
            item.quantity,
            item.discountPercent,
            item.discountAmount,
          );

          return (
            <TableRow className="last:border-b! *:not-last:border-e">
              <TableCell className="p-0 w-0">
                <ResetItemButton onClick={onRemoveRow} />
              </TableCell>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].barcode`}
                  children={(field) => (
                    <ProductSelector
                      action="enterOrSelect"
                      items={productsByBarcodeArray}
                      value={field.state.value}
                      onInputValueChange={(value: string) => field.handleChange(value)}
                      onItemSelect={(barcode) => {
                        const product = productsByBarcode.get(barcode);
                        if (!product) return;
                        itemField.handleChange({
                          ...DEFAULT_INVOICE_ITEM,
                          ...product,
                          productId: product.id,
                          barcode: product.barcode ?? undefined,
                          purchasePrice: product.purchasePrice.toString(),
                          sellingPrice: product.sellingPrice.toString(),
                        });
                      }}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].description`}
                  children={(field) => (
                    <ProductSelector
                      action="enterOrSelect"
                      items={productsByDescriptionArray}
                      value={field.state.value}
                      onInputValueChange={(value: string) => field.handleChange(value)}
                      onItemSelect={(description) => {
                        const product = productsByDescription.get(description);
                        if (!product) return;
                        itemField.handleChange({
                          ...DEFAULT_INVOICE_ITEM,
                          ...product,
                          productId: product.id,
                          barcode: product.barcode ?? undefined,
                          purchasePrice: product.purchasePrice.toString(),
                          sellingPrice: product.sellingPrice.toString(),
                        });
                      }}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].quantity`}
                  children={(field) => (
                    <InputNumpad
                      variant="ghost"
                      className="w-20"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                      min={1}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].purchasePrice`}
                  children={(field) => (
                    <InputNumpad
                      variant="ghost"
                      className="w-20"
                      value={new SafeDecimal(field.state.value).toNumber()}
                      onChange={(e) => field.handleChange(e.target.value)}
                      min={0}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].sellingPrice`}
                  children={(field) => (
                    <InputNumpad
                      variant="ghost"
                      className="w-20"
                      value={new SafeDecimal(field.state.value).toNumber()}
                      onChange={(e) => field.handleChange(e.target.value)}
                      min={0}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="font-semibold">{formatMoney(itemSubtotal)}</TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].discountPercent`}
                  children={(field) => (
                    <InputNumpad
                      variant="ghost"
                      className="w-20"
                      value={field.state.value || 0}
                      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                      min={0}
                      max={100}
                    />
                  )}
                />
              </TableCell>
              <TableCell>{formatMoney(percentDiscount)}</TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].discountAmount`}
                  children={(field) => (
                    <InputNumpad
                      variant="ghost"
                      value={new SafeDecimal(field.state.value || 0).toNumber()}
                      onChange={(e) => field.handleChange(e.target.value)}
                      min={0}
                      max={itemSubtotal.minus(percentDiscount).toNumber()}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="font-bold">{formatMoney(itemTotal)}</TableCell>
            </TableRow>
          );
        }}
      />
    );
  };

  const AddNewRowButton = (props: React.ComponentProps<typeof Button>) => {
    const { t } = useTranslation();
    return (
      <TableRow>
        <TableCell colSpan={12} className="p-0">
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-none bg-secondary/50"
            {...props}
          >
            <PlusIcon />
            {t("invoice.addRow")}
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <form
      className="h-full p-2 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <InvoiceHeader />

      <div className="h-full overflow-hidden flex flex-col *:flex-1 *:basis-0 border rounded">
        <Table>
          <InvoiceTableHeader />

          <TableBody>
            <form.Field
              name="items"
              mode="array"
              children={(field) => (
                <>
                  {field.state.value.map((_, index) => (
                    <InvoiceTableRow
                      key={index}
                      index={index}
                      onRemoveRow={() => {
                        field.removeValue(index);
                        // Ensure at least one item remains
                        if (field.state.value.length === 0) {
                          field.pushValue({ ...DEFAULT_INVOICE_ITEM });
                        }
                      }}
                    />
                  ))}

                  <AddNewRowButton onClick={() => field.pushValue({ ...DEFAULT_INVOICE_ITEM })} />
                </>
              )}
            />
          </TableBody>
        </Table>
      </div>

      {createPurchaseInvoiceError && <ErrorElement error={createPurchaseInvoiceError} />}

      <InvoiceFooter invoiceType="PURCHASE" form={form} />
    </form>
  );
}

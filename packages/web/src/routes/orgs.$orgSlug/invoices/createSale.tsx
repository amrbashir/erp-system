import { CreateSaleInvoiceDto, CreateSaleInvoiceItemDto, ProductEntity } from "@erp-system/sdk/zod";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";

import type z from "zod";

import { apiClient } from "@/api-client";
import { FormErrors } from "@/components/form-errors";
import { Hotkey } from "@/components/ui/hotkey";
import { InputNumpad } from "@/components/ui/input-numpad";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { formatMoney } from "@/utils/formatMoney";
import {
  calculateInvoiceSubtotal,
  calculateInvoiceTotal,
  calculateItemDiscount,
  calculateItemSubtotal,
  calculateItemTotal,
} from "@/utils/invoice-calculator";
import { SafeDecimal } from "@/utils/SafeDecimal";

import { InvoiceFooter } from "./-create-invoice-footer";
import { CustomerSelector } from "./-customer-selector";
import { ProductSelector } from "./-product-selector";

export const Route = createFileRoute("/orgs/$orgSlug/invoices/createSale")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.createSale"),
  }),
});

// Types
type CreateInvoiceItem = z.infer<typeof CreateSaleInvoiceItemDto>;
type Product = z.infer<typeof ProductEntity>;
type Invoice = Omit<z.infer<typeof CreateSaleInvoiceDto>, "items"> & {
  items: (CreateInvoiceItem & Partial<Product>)[];
};

const DEFAULT_INVOICE_ITEM = {
  productId: "",
  quantity: 1,
  barcode: "",
  description: "",
  price: "0",
  sellingPrice: "0",
  stockQuantity: 0,
  discountPercent: 0,
  discountAmount: "0",
};

function RouteComponent() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();

  const params = { path: { orgSlug } };

  const { data: products } = useQuery({
    queryKey: ["products", orgSlug],
    queryFn: async () => apiClient.getThrowing("/orgs/{orgSlug}/products", { params }),
    select: (res) => res.data,
  });

  const { data: customers } = useQuery({
    queryKey: ["customers", orgSlug],
    queryFn: async () => apiClient.getThrowing("/orgs/{orgSlug}/customers", { params }),
    select: (res) => res.data,
  });

  // Create lookup maps for faster product retrieval
  const productsByBarcode = React.useMemo(
    () => new Map(products?.map((product) => [product.barcode, product])),
    [products],
  );
  const productsByBarcodeArray = React.useMemo(
    () => Array.from(productsByBarcode.keys()).filter((b) => b !== undefined),
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

  const form = useForm({
    defaultValues: {
      items: Array.from({ length: 30 }, () => ({ ...DEFAULT_INVOICE_ITEM })),
      customerId: undefined,
      discountPercent: 0,
      discountAmount: "0",
      paid: "0",
    } as Invoice,
    validators: {
      onChange: ({ value, formApi }) => {
        const paidField = formApi.getFieldMeta("paid");

        // If the paid field is dirty, we don't want to auto-update it
        if (paidField?.isDirty) return;

        const total = calculateInvoiceTotal(
          calculateInvoiceSubtotal(value.items, "SALE"),
          value.discountPercent,
          value.discountAmount,
        );
        formApi.setFieldValue("paid", total.toString(), { dontUpdateMeta: true });
      },

      onSubmit: ({ value, formApi }) => {
        const validItems = value.items.filter((i) => !!i.productId);
        if (validItems.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreateSaleInvoiceDto);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const validItems = value.items.filter((i) => !!i.productId);

      const { error } = await apiClient.post("/orgs/{orgSlug}/invoices/createSale", {
        params: { path: { orgSlug } },
        body: {
          ...value,
          items: validItems.map((i) => ({
            productId: i.productId,
            price: i.price,
            quantity: i.quantity,
            discountPercent: i.discountPercent,
            discountAmount: i.discountAmount,
          })),
        },
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      toast.success(t("invoice.createdSuccessfully"));
      client.invalidateQueries({ queryKey: ["invoices", orgSlug, "SALE"] });
      formApi.reset();
    },
  });

  // Memoize the product selection callbacks to prevent unnecessary re-renders
  const handleBarcodeProductSelect = React.useCallback(
    (barcode: string, field: any) => {
      const product = productsByBarcode.get(barcode);
      if (!product) return;
      field.setValue({
        ...DEFAULT_INVOICE_ITEM,
        ...product,
        productId: product.id,
        price: product.sellingPrice,
      });
    },
    [productsByBarcode],
  );

  const handleDescriptionProductSelect = React.useCallback(
    (description: string, field: any) => {
      const product = productsByDescription.get(description);
      if (!product) return;
      field.setValue({
        ...DEFAULT_INVOICE_ITEM,
        ...product,
        productId: product.id,
        price: product.sellingPrice,
      });
    },
    [productsByDescription],
  );

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
          selector={(state) => [
            state.canSubmit,
            state.isSubmitting,
            state.values.items.some((item) => item.productId),
          ]}
          children={([canSubmit, isSubmitting, hasValidItems]) => (
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
              <Button disabled={!canSubmit || !hasValidItems}>
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
    <TableHeader className="bg-muted sticky top-0 z-10">
      <TableRow className="*:font-bold">
        <TableHead></TableHead>
        <TableHead>{t("common.ui.number")}</TableHead>
        <TableHead className="min-w-3xs">{t("common.form.barcode")}</TableHead>
        <TableHead className="min-w-3xs">{t("common.form.description")}</TableHead>
        <TableHead className="w-40">{t("common.form.quantity")}</TableHead>
        <TableHead className="w-40">{t("common.form.price")}</TableHead>
        <TableHead>{t("common.form.subtotal")}</TableHead>
        <TableHead className="w-40">{t("common.form.discountPercent")}</TableHead>
        <TableHead></TableHead>
        <TableHead className="w-40">{t("common.form.discountAmount")}</TableHead>
        <TableHead>{t("common.form.total")}</TableHead>
      </TableRow>
    </TableHeader>
  );

  const ResetItemButton = ({
    className,
    variant,
    ...props
  }: React.ComponentProps<typeof Button>) => (
    <Button
      type="button"
      variant="ghost"
      className="w-9 rounded-none text-red-500 dark:text-red-300"
      {...props}
    >
      <XIcon className="size-4" />
    </Button>
  );

  const InvoiceTableRow = ({ index }: { index: number }) => {
    return (
      <form.Field
        name={`items[${index}]`}
        children={(itemField) => {
          const item = itemField.state.value;
          const itemSubtotal = calculateItemSubtotal(item.price, item.quantity);
          const { percentDiscount } = calculateItemDiscount(
            itemSubtotal,
            item.discountPercent,
            item.discountAmount,
          );
          const itemTotal = calculateItemTotal(
            item.price,
            item.quantity,
            item.discountPercent,
            item.discountAmount,
          );

          return (
            <TableRow className="*:not-last:border-e">
              <TableCell className="p-0 w-0">
                <ResetItemButton onClick={() => itemField.setValue({ ...DEFAULT_INVOICE_ITEM })} />
              </TableCell>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].barcode`}
                  children={(field) => (
                    <ProductSelector
                      items={productsByBarcodeArray}
                      value={field.state.value}
                      onInputValueChange={(value: string) => field.handleChange(value)}
                      onItemSelect={(barcode) => handleBarcodeProductSelect(barcode, itemField)}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].description`}
                  children={(field) => (
                    <ProductSelector
                      items={productsByDescriptionArray}
                      value={field.state.value}
                      onInputValueChange={(value: string) => field.handleChange(value)}
                      onItemSelect={(description) =>
                        handleDescriptionProductSelect(description, itemField)
                      }
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
                      max={itemField.state.value.stockQuantity}
                    />
                  )}
                />
              </TableCell>
              <TableCell className="p-0">
                <form.Field
                  name={`items[${index}].price`}
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

  const AddNewRowButton = ({
    className,
    variant,
    ...props
  }: React.ComponentProps<typeof Button>) => {
    const { t } = useTranslation();
    return (
      <TableRow>
        <TableCell colSpan={11} className="p-0">
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
                    <InvoiceTableRow key={index} index={index} />
                  ))}

                  <AddNewRowButton onClick={() => field.pushValue({ ...DEFAULT_INVOICE_ITEM })} />
                </>
              )}
            />
          </TableBody>
        </Table>
      </div>

      <form.Subscribe children={(state) => <FormErrors formState={state} />} />

      <InvoiceFooter invoiceType="SALE" form={form} />
    </form>
  );
}

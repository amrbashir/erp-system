import {
  CreatePurchaseInvoiceDto,
  CreatePurchaseInvoiceItemDto,
  CustomerEntity,
  ProductEntity,
} from "@erp-system/sdk/zod";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button";
import { Card } from "@/shadcn/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";

import type { ReactFormApi } from "@tanstack/react-form";
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

export const Route = createFileRoute("/orgs/$orgSlug/invoices/createPurchase")({
  component: RouteComponent,
  context: () => ({
    title: i18n.t("routes.invoice.createPurchase"),
  }),
});

// Types
type AnyReactFormApi = ReactFormApi<any, any, any, any, any, any, any, any, any, any>;
type Product = z.infer<typeof ProductEntity>;
type Customer = z.infer<typeof CustomerEntity>;
type Invoice = z.infer<typeof CreatePurchaseInvoiceDto>;
type InvoiceItem = Invoice["items"][number];

const DEFAULT_INVOICE_ITEM = {
  barcode: undefined,
  description: "",
  quantity: 1,
  purchasePrice: "0",
  sellingPrice: "0",
  productId: undefined,
};

function RouteComponent() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();

  const params = useMemo(() => ({ path: { orgSlug } }), [orgSlug]);

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
          calculateInvoiceSubtotal(value.items, "PURCHASE"),
          value.discountPercent,
          value.discountAmount,
        );
        formApi.setFieldValue("paid", total.toString(), { dontUpdateMeta: true });
      },

      onSubmit: ({ value, formApi }) => {
        const validItems = value.items.filter((i) => !!i.description);
        if (validItems.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreatePurchaseInvoiceDto);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const validItems = value.items.filter((i) => !!i.description);

      const { error } = await apiClient.post("/orgs/{orgSlug}/invoices/createPurchase", {
        params: { path: { orgSlug } },
        body: { ...value, items: validItems },
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      toast.success(t("invoice.createdSuccessfully"));
      client.invalidateQueries({ queryKey: ["invoices", orgSlug, "PURCHASE"] });
      formApi.reset();
    },
  });

  const [invoiceItems, validInvoiceItems] = useStore(form.store, (state) => [
    state.values.items,
    state.values.items.filter((i) => !!i.description && i.quantity > 0),
  ]);

  const handleResetItem = (index: number) => {
    form.replaceFieldValue("items", index, { ...DEFAULT_INVOICE_ITEM });
    form.validate("change");
  };

  const addEmptyItem = () => {
    form.pushFieldValue("items", { ...DEFAULT_INVOICE_ITEM });
    form.validate("change");
  };

  const handleAddProduct = (index: number, product: Product) => {
    form.replaceFieldValue("items", index, {
      ...DEFAULT_INVOICE_ITEM,
      ...product,
      productId: product.id,
    });
    form.validate("change");
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...form.getFieldValue("items")];
    form.replaceFieldValue("items", index, {
      ...newItems[index],
      [field]: value,
    });
    form.validate("change");
  };

  function InvoiceHeader({
    customers,
    hasItems,
    onReset,
  }: {
    customers: Customer[] | undefined;
    hasItems: boolean;
    onReset: () => void;
  }) {
    const { t } = useTranslation();

    return (
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
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  variant="secondary"
                  onClick={() => onReset()}
                >
                  <Hotkey hotkey="F7" onHotkey={() => form.reset()} />
                  {t("common.actions.delete")}
                </Button>
                <Button disabled={!canSubmit || !hasItems}>
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
  }

  return (
    <form
      className="h-full p-2 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <InvoiceHeader
        customers={customers}
        hasItems={validInvoiceItems.length > 0}
        onReset={() => form.reset()}
      />

      <div className="h-full overflow-hidden flex flex-col *:flex-1 *:basis-0 border rounded">
        <InvoiceTable
          items={invoiceItems}
          products={products}
          onAddEmptyItem={addEmptyItem}
          onAddItem={handleAddProduct}
          onResetItem={handleResetItem}
          onUpdateItemField={handleUpdateItemField}
        />
      </div>

      <form.Subscribe children={(state) => <FormErrors formState={state} />} />

      <InvoiceFooter invoiceType="PURCHASE" form={form} />
    </form>
  );
}

// Main invoice table component
function InvoiceTable({
  items,
  products,
  onAddEmptyItem,
  onAddItem,
  onResetItem,
  onUpdateItemField,
  ...props
}: {
  items: InvoiceItem[];
  products: Product[] | undefined;
  onAddEmptyItem: () => void;
  onAddItem: (index: number, product: Product) => void;
  onResetItem: (index: number) => void;
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: string | number) => void;
} & React.ComponentProps<typeof Table>) {
  const { t } = useTranslation();

  return (
    <Table {...props}>
      <TableHeader className="bg-muted sticky top-0 z-10">
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

      <TableBody>
        {items.map((item, index) => (
          <InvoiceTableRow
            key={index}
            item={item}
            index={index}
            products={products}
            items={items}
            onUpdateItemField={onUpdateItemField}
            onAdd={onAddItem}
            onReset={onResetItem}
          />
        ))}

        <TableRow>
          <TableCell colSpan={12} className="p-0">
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-none bg-secondary/50"
              onClick={() => onAddEmptyItem()}
            >
              <PlusIcon />
              {t("invoice.addRow")}
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

// Invoice table row component
function InvoiceTableRow({
  item,
  index,
  products,
  items,
  onAdd,
  onReset,
  onUpdateItemField,
}: {
  item: InvoiceItem;
  index: number;
  products: Product[] | undefined;
  items: InvoiceItem[];
  onAdd: (index: number, product: Product) => void;
  onReset: (index: number) => void;
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: string | number) => void;
}) {
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
    <TableRow className="*:not-last:border-e">
      <TableCell className="p-0 w-0">
        <Button
          type="button"
          variant="ghost"
          className="w-9 rounded-none text-red-500 dark:text-red-300"
          onClick={() => onReset(index)}
        >
          <XIcon className="size-4" />
        </Button>
      </TableCell>
      <TableCell>{index + 1}</TableCell>
      <TableCell className="p-0">
        <ProductSelector
          items={(products ?? [])
            .map((p) => p.barcode)
            .filter((b) => b !== undefined)
            .filter((b) => items.every((i) => i.barcode !== b))}
          value={item.barcode ?? ""}
          onInputValueChange={(value) => {
            item.productId && onReset(index);
            onUpdateItemField(index, "barcode", value);
          }}
          onItemSelect={(item) => {
            const product = products?.find((i) => i.barcode === item);
            if (product) onAdd(index, product);
          }}
        />
      </TableCell>
      <TableCell className="p-0">
        <ProductSelector
          items={(products ?? [])
            .map((p) => p.description)
            .filter((b) => items.every((i) => i.description !== b))}
          value={item.description}
          onInputValueChange={(value) => {
            item.productId && onReset(index);
            onUpdateItemField(index, "description", value);
          }}
          onItemSelect={(item) => {
            const product = products?.find((i) => i.description === item);
            if (product) onAdd(index, product);
          }}
        />
      </TableCell>
      <TableCell className="p-0">
        <InputNumpad
          variant="ghost"
          className="w-20"
          value={item.quantity}
          onChange={(e) => onUpdateItemField(index, "quantity", e.target.valueAsNumber)}
          min={1}
        />
      </TableCell>
      <TableCell className="p-0">
        <InputNumpad
          variant="ghost"
          className="w-20"
          value={new SafeDecimal(item.purchasePrice).toNumber()}
          onChange={(e) => onUpdateItemField(index, "purchasePrice", e.target.value)}
          min={0}
        />
      </TableCell>
      <TableCell className="p-0">
        <InputNumpad
          variant="ghost"
          className="w-20"
          value={new SafeDecimal(item.sellingPrice).toNumber()}
          onChange={(e) => onUpdateItemField(index, "sellingPrice", e.target.value)}
          min={0}
        />
      </TableCell>
      <TableCell className="font-semibold">{formatMoney(itemSubtotal)}</TableCell>
      <TableCell className="p-0">
        <InputNumpad
          variant="ghost"
          className="w-20"
          value={item.discountPercent || 0}
          onChange={(e) => onUpdateItemField(index, "discountPercent", e.target.valueAsNumber)}
          min={0}
          max={100}
        />
      </TableCell>
      <TableCell>{formatMoney(percentDiscount)}</TableCell>
      <TableCell className="p-0">
        <InputNumpad
          variant="ghost"
          className="w-20"
          value={new SafeDecimal(item.discountAmount || 0).toNumber()}
          onChange={(e) => onUpdateItemField(index, "discountAmount", e.target.value)}
          min={0}
          max={itemSubtotal.toNumber()}
        />
      </TableCell>
      <TableCell className="font-bold">{formatMoney(itemTotal)}</TableCell>
    </TableRow>
  );
}

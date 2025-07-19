import {
  CreateSaleInvoiceDto,
  CreateSaleInvoiceItemDto,
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
import { InputNumpad } from "@/components/ui/input-numpad";
import { Hotkey } from "@/components/ui/kbd";
import { useHotkeys } from "@/hooks/use-hotkeys";
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

export const Route = createFileRoute("/org/$orgSlug/invoices/createSale")({
  component: CreateSaleInvoice,
  context: () => ({
    title: i18n.t("routes.invoice.createSale"),
  }),
});

// Types
type AnyReactFormApi = ReactFormApi<any, any, any, any, any, any, any, any, any, any>;
type CreateInvoiceItem = z.infer<typeof CreateSaleInvoiceItemDto>;
type Product = z.infer<typeof ProductEntity>;
type Customer = z.infer<typeof CustomerEntity>;
type Invoice = z.infer<ReturnType<(typeof CreateSaleInvoiceDto)["strict"]>> & {
  items?: (CreateInvoiceItem & Product)[];
};
type InvoiceItem = Invoice["items"][number];

const DEFAULT_INVOICE_ITEM = {
  barcode: "",
  description: "",
  quantity: 1,
  purchasePrice: "0",
  price: "0",
  sellingPrice: "0",
  productId: "",
};

// Main component
function CreateSaleInvoice() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/product/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/customer/getAll", { params: { path: { orgSlug } } }),
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
          calculateInvoiceSubtotal(value.items, "SALE"),
          value.discountPercent,
          value.discountAmount,
        );
        formApi.setFieldValue("paid", total.toString(), { dontUpdateMeta: true });
      },

      onSubmit: ({ value, formApi }) => {
        const validItems = value.items.filter((i) => !!i.description || !!i.productId);
        if (validItems.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreateSaleInvoiceDto as any);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const validItems = value.items.filter((i) => !!i.description || !!i.productId);

      const { error } = await apiClient.post("/org/{orgSlug}/invoice/createSale", {
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
      client.invalidateQueries({ queryKey: ["invoices"] });
      formApi.reset();
    },
  });

  const [
    invoiceItems,
    validInvoiceItems,
    invoiceDiscountPercent,
    invoiceDiscountAmount,
    invoicePaid,
  ] = useStore(form.store, (state) => [
    state.values.items,
    state.values.items.filter((i) => !!i.description && i.quantity > 0),
    state.values.discountPercent,
    state.values.discountAmount,
    state.values.paid,
  ]);

  // Calculate subtotal (before invoice-level discounts)
  const subtotal = useMemo(() => calculateInvoiceSubtotal(invoiceItems, "SALE"), [invoiceItems]);

  const handleResetItem = (index: number) => {
    form.replaceFieldValue("items", index, { ...DEFAULT_INVOICE_ITEM } as any);
    form.validate("change");
  };

  const addEmptyItem = () => {
    form.pushFieldValue("items", { ...DEFAULT_INVOICE_ITEM } as any);
    form.validate("change");
  };

  const handleAddItem = (index: number, product: Product) => {
    form.replaceFieldValue("items", index, {
      ...DEFAULT_INVOICE_ITEM,
      ...product,
      productId: product.id,
      price: product.sellingPrice,
    });
    form.validate("change");
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof InvoiceItem,
    value: number | string,
  ) => {
    const newItems = [...form.getFieldValue("items")];
    form.replaceFieldValue("items", index, {
      ...newItems[index],
      [field]: value,
    });
    form.validate("change");
  };

  const handleUpdateInvoiceField = (field: keyof Invoice, value: any) => {
    form.setFieldValue(field, value);
    form.validate("change");
  };

  useHotkeys(
    {
      F7: (event) => {
        event.preventDefault();
        form.reset();
      },
      F8: (event) => {
        event.preventDefault();
        form.handleSubmit();
      },
    },
    [form],
  );

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
        form={form}
        customers={customers}
        hasItems={validInvoiceItems.length > 0}
        onReset={() => form.reset()}
      />

      <Card className="h-full flex flex-col overflow-hidden *:flex-1 *:basis-0 p-0">
        <InvoiceTable
          items={invoiceItems}
          products={products}
          onAddItem={handleAddItem}
          onAddEmptyItem={addEmptyItem}
          onResetItem={handleResetItem}
          onUpdateItemField={handleUpdateItemField}
        />
      </Card>

      <form.Subscribe children={(state) => <FormErrors formState={state} />} />

      <InvoiceFooter
        invoiceType="SALE"
        subtotal={subtotal}
        discountPercent={invoiceDiscountPercent}
        discountAmount={invoiceDiscountAmount}
        paid={invoicePaid}
        onUpdateInvoiceField={handleUpdateInvoiceField}
      />
    </form>
  );
}

// Header component with customer select and action buttons
function InvoiceHeader({
  form,
  customers,
  hasItems,
  onReset,
}: {
  form: AnyReactFormApi;
  customers: Customer[] | undefined;
  hasItems: boolean;
  onReset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="h-fit flex flex-col md:flex-row md:justify-between gap-2">
      <form.Field
        name="customerId"
        children={(field) => <CustomerSelector customers={customers} field={field} />}
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
                <Hotkey>F7</Hotkey>
                {t("common.actions.delete")}
              </Button>
              <Button disabled={!canSubmit || !hasItems}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                <Hotkey>F8</Hotkey>
                {t("common.actions.create")}
              </Button>
            </>
          )}
        />
      </div>
    </div>
  );
}

// Main invoice table component
function InvoiceTable({
  items,
  products,
  onAddItem,
  onAddEmptyItem,
  onResetItem,
  onUpdateItemField,
  ...props
}: {
  items: InvoiceItem[];
  products: Product[] | undefined;
  onAddItem: (index: number, product: Product) => void;
  onAddEmptyItem: () => void;
  onResetItem: (index: number) => void;
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: number | string) => void;
} & React.ComponentProps<typeof Table>) {
  const { t } = useTranslation();

  return (
    <Table {...props}>
      <TableHeader className="bg-muted sticky top-0 z-1">
        <TableRow className="*:font-bold">
          <TableHead></TableHead>
          <TableHead>{t("common.ui.number")}</TableHead>
          <TableHead className="min-w-3xs">{t("common.form.barcode")}</TableHead>
          <TableHead className="min-w-3xs">{t("common.form.description")}</TableHead>
          <TableHead className="w-40">{t("common.form.quantity")}</TableHead>
          <TableHead className="w-40">{t("common.form.price")}</TableHead>
          <TableHead>{t("common.ui.subtotal")}</TableHead>
          <TableHead className="w-40">{t("common.ui.discountPercent")}</TableHead>
          <TableHead></TableHead>
          <TableHead className="w-40">{t("common.ui.discountAmount")}</TableHead>
          <TableHead>{t("common.ui.total")}</TableHead>
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
            onAdd={onAddItem}
            onReset={onResetItem}
            onUpdateItemField={onUpdateItemField}
          />
        ))}

        <TableRow>
          <TableCell colSpan={11} className="p-0">
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
  onUpdateItemField,
  onReset,
  onAdd,
}: {
  item: InvoiceItem;
  index: number;
  products: Product[] | undefined;
  items: InvoiceItem[];
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: number | string) => void;
  onReset: (index: number) => void;
  onAdd: (index: number, product: Product) => void;
}) {
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
    <TableRow className="[&>td]:border-e [&>td:last-child]:border-none">
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
          value={item.barcode}
          onInputValueChange={(value) => {
            onReset(index);
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
            onReset(index);
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
          max={item.stockQuantity}
        />
      </TableCell>
      <TableCell className="p-0">
        <InputNumpad
          variant="ghost"
          className="w-20"
          value={new SafeDecimal(item.price).toNumber()}
          onChange={(e) => onUpdateItemField(index, "price", e.target.value)}
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

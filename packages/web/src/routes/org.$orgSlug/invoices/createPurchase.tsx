import {
  CreatePurchaseInvoiceDto,
  CreatePurchaseInvoiceItemDto,
  CustomerEntity,
} from "@erp-system/sdk/zod";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Decimal } from "decimal.js";
import { Loader2Icon, XIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button";
import { Card, CardContent, CardFooter } from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Separator } from "@/shadcn/components/ui/separator";
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
import { CustomerSelector } from "@/components/invoice-customer-selector";
import { InputNumpad } from "@/components/ui/input-numpad";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";
import { formatMoney } from "@/utils/formatMoney";
import {
  calculateInvoicePercentDiscount,
  calculateInvoiceSubtotal,
  calculateInvoiceTotal,
  calculateItemDiscount,
  calculateItemSubtotal,
  calculateItemTotal,
} from "@/utils/invoice-calculator";
import { SafeDecimal } from "@/utils/SafeDecimal";

export const Route = createFileRoute("/org/$orgSlug/invoices/createPurchase")({
  component: CreatePurchaseInvoice,
  context: () => ({
    title: i18n.t("routes.invoice.createPurchase"),
  }),
});

// Types
type AnyReactFormApi = ReactFormApi<any, any, any, any, any, any, any, any, any, any>;
type CreateInvoiceItem = z.infer<typeof CreatePurchaseInvoiceItemDto>;
type Customer = z.infer<typeof CustomerEntity>;
type Invoice = z.infer<ReturnType<(typeof CreatePurchaseInvoiceDto)["strict"]>> & {
  items?: CreateInvoiceItem[];
};
type InvoiceItem = Invoice["items"][number];

const DEFAULT_INVOICE_ITEM = {
  description: "",
  quantity: 1,
  purchasePrice: "0",
  price: "0",
  sellingPrice: "0",
};

// Main component
function CreatePurchaseInvoice() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () =>
      apiClient.getThrowing("/org/{orgSlug}/customer/getAll", { params: { path: { orgSlug } } }),
    select: (res) => res.data,
  });

  const form = useForm({
    defaultValues: {
      items: Array.from({ length: 20 }, () => ({ ...DEFAULT_INVOICE_ITEM })),
      customerId: undefined,
      discountPercent: 0,
      discountAmount: "0",
    } as Invoice,
    validators: {
      onChange: ({ value, formApi }) => {
        if (!!value.items[value.items.length - 1].description) {
          formApi.pushFieldValue("items", { ...DEFAULT_INVOICE_ITEM });
        }
      },

      onSubmit: ({ value, formApi }) => {
        const validItems = value.items.filter((i) => !!i.description);
        if (validItems.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreatePurchaseInvoiceDto as any);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const validItems = value.items.filter((i) => !!i.description);

      const { error } = await apiClient.post("/org/{orgSlug}/invoice/createPurchase", {
        params: { path: { orgSlug } },
        body: { ...value, items: validItems },
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      toast.success(t("invoice.createdSuccessfully"));
      client.invalidateQueries({ queryKey: ["invoices", "PURCHASE", orgSlug] });
      formApi.reset();
    },
  });

  const [invoiceItems, validInvoiceItems, invoiceDiscountPercent, invoiceDiscountAmount] = useStore(
    form.store,
    (state) => [
      state.values.items,
      state.values.items.filter((i) => !!i.description && i.quantity > 0),
      state.values.discountPercent,
      state.values.discountAmount,
    ],
  );

  // Calculate subtotal (before invoice-level discounts)
  const subtotal = useMemo(
    () => calculateInvoiceSubtotal(validInvoiceItems, "PURCHASE"),
    [validInvoiceItems],
  );

  const handleRemoveItem = (index: number) => {
    const newItems = [...form.getFieldValue("items")];
    newItems.splice(index, 1);
    // Ensure at least one item exists
    if (newItems.length === 0) newItems.push({ ...DEFAULT_INVOICE_ITEM });
    form.setFieldValue("items", newItems);
    form.validate("change");
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...invoiceItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    form.setFieldValue("items", newItems);
    form.validate("change");
  };

  const handleUpdateInvoiceField = (field: keyof Invoice, value: any) => {
    form.setFieldValue(field, value);
    form.validate("change");
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
      <InvoiceHeader
        form={form}
        customers={customers}
        hasItems={validInvoiceItems.length > 0}
        onReset={() => form.reset()}
      />

      <div className="h-full flex flex-col overflow-hidden border rounded-lg *:flex-1 *:basis-0">
        <InvoiceTable
          items={invoiceItems}
          onUpdateItemField={handleUpdateItemField}
          onRemoveItem={handleRemoveItem}
        />
      </div>

      <form.Subscribe children={(state) => <FormErrors formState={state} />} />

      <InvoiceFooter
        subtotal={subtotal}
        discountPercent={invoiceDiscountPercent}
        discountAmount={invoiceDiscountAmount}
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
                {t("common.actions.delete")}
              </Button>
              <Button disabled={!canSubmit || !hasItems}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
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
  onRemoveItem,
  onUpdateItemField,
  ...props
}: {
  items: InvoiceItem[];
  onRemoveItem: (index: number) => void;
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: string | number) => void;
} & React.ComponentProps<typeof Table>) {
  const { t } = useTranslation();

  return (
    <Table {...props}>
      <TableHeader className="bg-muted">
        <TableRow className="*:font-bold">
          <TableHead>{t("common.ui.number")}</TableHead>
          <TableHead className="min-w-3xs">{t("common.form.barcode")}</TableHead>
          <TableHead className="min-w-3xs">{t("common.form.description")}</TableHead>
          <TableHead className="w-40">{t("common.form.quantity")}</TableHead>
          <TableHead className="w-40">{t("common.pricing.purchase")}</TableHead>
          <TableHead className="w-40">{t("common.pricing.selling")}</TableHead>
          <TableHead>{t("invoice.subtotal")}</TableHead>
          <TableHead className="w-40">{t("invoice.discountPercent")}</TableHead>
          <TableHead></TableHead>
          <TableHead className="w-40">{t("invoice.discountAmount")}</TableHead>
          <TableHead>{t("invoice.total")}</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item, index) => (
          <InvoiceTableRow
            key={index}
            item={item}
            index={index}
            onUpdateItemField={onUpdateItemField}
            onRemove={onRemoveItem}
          />
        ))}
      </TableBody>
    </Table>
  );
}

// Invoice table row component
function InvoiceTableRow({
  item,
  index,
  onUpdateItemField,
  onRemove,
}: {
  item: InvoiceItem;
  index: number;
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: string | number) => void;
  onRemove: (index: number) => void;
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
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell className="p-0">
        <Input
          className="rounded-none focus-visible:z-1 relative"
          value={item.barcode}
          onChange={(e) => onUpdateItemField(index, "barcode", e.target.value)}
        />
      </TableCell>
      <TableCell className="p-0">
        <Input
          className="rounded-none focus-visible:z-1 relative"
          value={item.description}
          onChange={(e) => onUpdateItemField(index, "description", e.target.value)}
        />
      </TableCell>
      <TableCell className="p-0">
        <InputNumpad
          rounded={false}
          className="w-20"
          value={item.quantity}
          onChange={(e) => onUpdateItemField(index, "quantity", e.target.valueAsNumber)}
          min={1}
        />
      </TableCell>
      <TableCell className="p-0">
        <InputNumpad
          rounded={false}
          className="w-20"
          value={new SafeDecimal(item.purchasePrice).toNumber()}
          onChange={(e) => onUpdateItemField(index, "purchasePrice", e.target.value)}
          min={0}
        />
      </TableCell>
      <TableCell className="p-0">
        <InputNumpad
          rounded={false}
          className="w-20"
          value={new SafeDecimal(item.sellingPrice).toNumber()}
          onChange={(e) => onUpdateItemField(index, "sellingPrice", e.target.value)}
          min={0}
        />
      </TableCell>
      <TableCell>{formatMoney(itemSubtotal)}</TableCell>
      <TableCell className="p-0">
        <InputNumpad
          rounded={false}
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
          rounded={false}
          className="w-20"
          value={new SafeDecimal(item.discountAmount || 0).toNumber()}
          onChange={(e) => onUpdateItemField(index, "discountAmount", e.target.value)}
          min={0}
          max={itemSubtotal.toNumber()}
        />
      </TableCell>
      <TableCell>{formatMoney(itemTotal)}</TableCell>
      <TableCell className="p-0 text-end">
        <Button
          type="button"
          onClick={() => onRemove(index)}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          <XIcon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Invoice footer component with totals and discount inputs
function InvoiceFooter({
  subtotal,
  discountPercent,
  discountAmount,
  onUpdateInvoiceField,
}: {
  subtotal: Decimal;
  discountPercent?: number;
  discountAmount?: string;
  onUpdateInvoiceField: (field: keyof Invoice, value: number | string) => void;
}) {
  const { t } = useTranslation();

  const percentDiscount = calculateInvoicePercentDiscount(subtotal, discountPercent);
  const totalPrice = calculateInvoiceTotal(subtotal, discountPercent, discountAmount);

  return (
    <Card className="md:w-fit md:ms-auto gap-2 p-2">
      <CardContent className="grid grid-cols-[auto_1fr_auto] grid-rows-3 items-center gap-2 p-2">
        <span>{t("invoice.subtotal")}:</span>
        <span></span>
        <span className="text-end">{formatMoney(subtotal)}</span>

        <span>{t("invoice.discountPercent")}:</span>
        <InputNumpad
          className="w-20"
          value={discountPercent}
          onChange={(e) => onUpdateInvoiceField("discountPercent", e.target.valueAsNumber)}
          min={0}
          max={100}
        />
        <span className="text-end">-{formatMoney(percentDiscount)}</span>

        <span>{t("invoice.discountAmount")}:</span>
        <InputNumpad
          className="w-20"
          value={new SafeDecimal(discountAmount || 0).toNumber()}
          onChange={(e) => onUpdateInvoiceField("discountAmount", e.target.value)}
          min={0}
          max={subtotal.toNumber()}
        />
        <span className="text-end">-{formatMoney(discountAmount ?? 0)}</span>
      </CardContent>

      <Separator />

      <CardFooter className="justify-between gap-2 p-2">
        <span>{t("invoice.total")}:</span>
        <span className="text-red-300">{formatMoney(totalPrice)}</span>
      </CardFooter>
    </Card>
  );
}

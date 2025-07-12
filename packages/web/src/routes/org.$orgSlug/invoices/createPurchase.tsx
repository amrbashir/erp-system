import {
  CreatePurchaseInvoiceDto,
  CreatePurchaseInvoiceItemDto,
  CustomerEntity,
} from "@erp-system/sdk/zod";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Decimal } from "decimal.js";
import { Loader2Icon, TrashIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/components/ui/table";

import type { ReactFormApi } from "@tanstack/react-form";
import type z from "zod";

import { apiClient } from "@/api-client";
import { AddProductDialog } from "@/components/add-product-dialog";
import { FormErrors } from "@/components/form-errors";
import { CustomerSelect } from "@/components/invoice-customer-select";
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

export const Route = createFileRoute("/org/$orgSlug/invoices/createPurchase")({
  component: CreatePurchaseInvoice,
  context: () => ({
    title: i18n.t("routes.createPurchaseInvoice"),
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
      items: [],
      customerId: undefined,
      discountPercent: 0,
      discountAmount: "0",
    } as Invoice,
    validators: {
      onSubmit: ({ value, formApi }) => {
        if (value.items.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreatePurchaseInvoiceDto as any);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await apiClient.post("/org/{orgSlug}/invoice/createPurchase", {
        params: { path: { orgSlug } },
        body: value,
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

  const [invoiceItems, invoiceDiscountPercent, invoiceDiscountAmount] = useStore(
    form.store,
    (state) => [state.values.items, state.values.discountPercent, state.values.discountAmount],
  );

  const handleAddItem = (item: InvoiceItem) => {
    form.pushFieldValue("items", item);
    form.validate("change");
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...form.getFieldValue("items")];
    newItems.splice(index, 1);
    form.setFieldValue("items", newItems);
    form.validate("change");
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof CreateInvoiceItem,
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

  const handleUpdateInvoiceDiscount = (field: "discountPercent" | "discountAmount", value: any) => {
    form.setFieldValue(field, value);
    form.validate("change");
  };

  return (
    <form
      className="h-full flex flex-col gap-2 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <InvoiceHeader
        form={form}
        customers={customers}
        hasItems={invoiceItems.length > 0}
        onReset={() => form.reset()}
        onAddItem={handleAddItem}
      />

      <div className="flex flex-col w-full h-full overflow-hidden">
        <div className="flex-1 basis-0 p-2 overflow-x-hidden overflow-y-auto">
          <InvoiceTable
            items={invoiceItems}
            invoiceDiscountAmount={invoiceDiscountAmount}
            invoiceDiscountPercent={invoiceDiscountPercent}
            onUpdateItemField={handleUpdateItemField}
            onRemoveItem={handleRemoveItem}
            onUpdateInvoiceDiscount={handleUpdateInvoiceDiscount}
          />

          <div className="mt-2">
            <form.Subscribe children={(state) => <FormErrors formState={state} />} />
          </div>
        </div>
      </div>
    </form>
  );
}

// Header component with customer select and action buttons
function InvoiceHeader({
  form,
  customers,
  hasItems,
  onReset,
  onAddItem,
}: {
  form: AnyReactFormApi;
  customers: Customer[] | undefined;
  hasItems: boolean;
  onReset: () => void;
  onAddItem: (item: InvoiceItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-rows-3 sm:grid-rows-none sm:grid-cols-[auto_auto_1fr] gap-2 px-2">
      <form.Field
        name="customerId"
        children={(field) => <CustomerSelect customers={customers} field={field} />}
      />

      <AddProductDialog className="row-start-3 sm:row-start-auto" onProductSubmit={onAddItem} />

      <div className="row-start-1 sm:row-start-auto flex gap-2 justify-end *:flex-1 md:*:flex-none">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <>
              <Button type="button" disabled={isSubmitting} variant="secondary" onClick={onReset}>
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
  invoiceDiscountPercent = 0,
  invoiceDiscountAmount = "0",
  onUpdateItemField,
  onRemoveItem,
  onUpdateInvoiceDiscount,
}: {
  items: InvoiceItem[];
  invoiceDiscountPercent?: number;
  invoiceDiscountAmount?: string;
  onUpdateItemField: (
    index: number,
    field: keyof CreateInvoiceItem,
    value: string | number,
  ) => void;
  onRemoveItem: (index: number) => void;
  onUpdateInvoiceDiscount: (field: "discountPercent" | "discountAmount", value: any) => void;
}) {
  const { t } = useTranslation();

  // Calculate subtotal (before invoice-level discounts)
  const subtotal = useMemo(() => calculateInvoiceSubtotal(items, "PURCHASE"), [items]);

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="*:font-bold">
            <TableHead>{t("common.ui.number")}</TableHead>
            <TableHead>{t("common.form.barcode")}</TableHead>
            <TableHead className="w-full">{t("common.form.description")}</TableHead>
            <TableHead>{t("common.form.quantity")}</TableHead>
            <TableHead>{t("common.pricing.purchase")}</TableHead>
            <TableHead>{t("common.pricing.selling")}</TableHead>
            <TableHead>{t("invoice.subtotal")}</TableHead>
            <TableHead>{t("invoice.discountPercent")}</TableHead>
            <TableHead></TableHead>
            <TableHead>{t("invoice.discountAmount")}</TableHead>
            <TableHead className="text-end!">{t("invoice.total")}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-secondary-foreground/50 p-20">
                {t("invoice.addItemsTo")}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <InvoiceTableRow
                key={index}
                item={item}
                index={index}
                onUpdateItemField={onUpdateItemField}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </TableBody>

        <InvoiceTableFooter
          subtotal={subtotal}
          discountPercent={invoiceDiscountPercent}
          discountAmount={invoiceDiscountAmount}
          onUpdateDiscount={onUpdateInvoiceDiscount}
        />
      </Table>
    </div>
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
  onUpdateItemField: (
    index: number,
    field: keyof CreateInvoiceItem,
    value: string | number,
  ) => void;
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
      <TableCell>{item.barcode}</TableCell>
      <TableCell>{item.description}</TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={item.quantity}
          onChange={(e) => onUpdateItemField(index, "quantity", e.target.valueAsNumber)}
          min={1}
        />
      </TableCell>
      <TableCell>{formatMoney(item.purchasePrice)}</TableCell>
      <TableCell>{formatMoney(item.sellingPrice)}</TableCell>
      <TableCell>{formatMoney(itemSubtotal)}</TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={item.discountPercent || 0}
          onChange={(e) => onUpdateItemField(index, "discountPercent", e.target.valueAsNumber)}
          min={0}
          max={100}
        />
      </TableCell>
      <TableCell>{formatMoney(percentDiscount)}</TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={new Decimal(item.discountAmount ?? 0).toNumber()}
          onChange={(e) => onUpdateItemField(index, "discountAmount", e.target.value)}
          min={0}
          max={itemSubtotal.toNumber()}
        />
      </TableCell>
      <TableCell className="text-end">{formatMoney(itemTotal)}</TableCell>
      <TableCell>
        <Button onClick={() => onRemove(index)} variant="ghost" size="sm">
          <TrashIcon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Invoice footer component with totals and discount inputs
function InvoiceTableFooter({
  subtotal,
  discountPercent,
  discountAmount,
  onUpdateDiscount,
}: {
  subtotal: Decimal;
  discountPercent: number;
  discountAmount: string;
  onUpdateDiscount: (field: "discountPercent" | "discountAmount", value: number | string) => void;
}) {
  const { t } = useTranslation();

  const percentDiscount = calculateInvoicePercentDiscount(subtotal, discountPercent);
  const totalPrice = calculateInvoiceTotal(subtotal, discountPercent, discountAmount);

  return (
    <TableFooter className="*:*:font-bold">
      <TableRow>
        <TableCell colSpan={10}>{t("invoice.subtotal")}</TableCell>
        <TableCell className="text-end">{formatMoney(subtotal)}</TableCell>
        <TableCell></TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6}></TableCell>
        <TableCell>{t("invoice.discountPercent")}</TableCell>
        <TableCell>
          <InputNumpad
            className="w-20"
            value={discountPercent}
            onChange={(e) => onUpdateDiscount("discountPercent", e.target.valueAsNumber)}
            min={0}
            max={100}
          />
        </TableCell>
        <TableCell>{formatMoney(percentDiscount)}</TableCell>
        <TableCell>{t("invoice.discountAmount")}</TableCell>
        <TableCell>
          <InputNumpad
            className="w-20"
            value={new Decimal(discountAmount).toNumber()}
            onChange={(e) => onUpdateDiscount("discountAmount", e.target.value)}
            min={0}
            max={subtotal.toNumber()}
          />
        </TableCell>
        <TableCell></TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={10}>{t("invoice.total")}</TableCell>
        <TableCell className="text-end text-red-300">{formatMoney(totalPrice)}</TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableFooter>
  );
}

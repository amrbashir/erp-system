import {
  CreateSaleInvoiceDto,
  CreateSaleInvoiceItemDto,
  CustomerEntity,
  ProductEntity,
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
import { ProductSelector } from "@/components/invoice-product-selector";
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

export const Route = createFileRoute("/org/$orgSlug/invoices/createSale")({
  component: CreateSaleInvoice,
  context: () => ({
    title: i18n.t("routes.createSaleInvoice"),
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
      items: Array.from({ length: 20 }, () => ({ ...DEFAULT_INVOICE_ITEM })),
      customerId: undefined,
      discountPercent: 0,
      discountAmount: "0",
    } as Invoice,
    validators: {
      onSubmit: ({ value, formApi }) => {
        const validItems = value.items.filter((i) => !!i.description);
        if (validItems.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreateSaleInvoiceDto as any);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const validItems = value.items.filter((i) => !!i.description);

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
      client.invalidateQueries({ queryKey: ["invoices", "SALE", orgSlug] });
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
  const subtotal = useMemo(() => calculateInvoiceSubtotal(invoiceItems, "SALE"), [invoiceItems]);

  const handleRemoveItem = (index: number) => {
    const newItems = [...form.getFieldValue("items")];
    newItems.splice(index, 1);
    form.setFieldValue("items", newItems);
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
          products={products}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onUpdateItemField={handleUpdateItemField}
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
  products,
  onAddItem,
  onRemoveItem,
  onUpdateItemField,
  ...props
}: {
  items: InvoiceItem[];
  products: Product[] | undefined;
  onAddItem: (index: number, product: Product) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: number | string) => void;
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
          <TableHead className="w-40">{t("common.form.price")}</TableHead>
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
            products={products}
            onAdd={onAddItem}
            onRemove={onRemoveItem}
            onUpdateItemField={onUpdateItemField}
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
  products,
  onUpdateItemField,
  onRemove,
  onAdd,
}: {
  item: InvoiceItem;
  index: number;
  products: Product[] | undefined;
  onUpdateItemField: (index: number, field: keyof InvoiceItem, value: number | string) => void;
  onRemove: (index: number) => void;
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
    <TableRow>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        <ProductSelector
          items={products?.map((p) => p.barcode).filter((b) => b !== undefined) || []}
          value={item.barcode}
          onItemSelect={(item) => {
            const product = products?.find((i) => i.barcode === item);
            product && onAdd(index, product);
          }}
        />
      </TableCell>
      <TableCell>
        <ProductSelector
          items={products?.map((p) => p.description) || []}
          value={item.description}
          onItemSelect={(item) => {
            const product = products?.find((i) => i.description === item);
            product && onAdd(index, product);
          }}
        />
      </TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={item.quantity}
          onChange={(e) => onUpdateItemField(index, "quantity", e.target.valueAsNumber)}
          min={1}
          max={item.stockQuantity}
        />
      </TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={new SafeDecimal(item.price).toNumber()}
          onChange={(e) => onUpdateItemField(index, "price", e.target.value)}
          min={0}
        />
      </TableCell>
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
          value={new SafeDecimal(item.discountAmount || 0).toNumber()}
          onChange={(e) => onUpdateItemField(index, "discountAmount", e.target.value)}
          min={0}
          max={itemSubtotal.toNumber()}
        />
      </TableCell>
      <TableCell>{formatMoney(itemTotal)}</TableCell>
      <TableCell>
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
        <span className="text-end">-{formatMoney(discountAmount || 0)}</span>
      </CardContent>

      <Separator />

      <CardFooter className="justify-between gap-2 p-2">
        <span>{t("invoice.total")}:</span>
        <span className="text-green-300">{formatMoney(totalPrice)}</span>
      </CardFooter>
    </Card>
  );
}

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
import { Loader2Icon, TrashIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shadcn/components/ui/resizable";
import { Separator } from "@/shadcn/components/ui/separator";
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
type InvoiceEditableField = "discountPercent" | "discountAmount";
type InvoiceItemEditableField = "price" | InvoiceEditableField;

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
      items: [],
      customerId: undefined,
      discountPercent: 0,
      discountAmount: "0",
    } as Invoice,
    validators: {
      onSubmit: ({ value, formApi }) => {
        if (value.items.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreateSaleInvoiceDto as any);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await apiClient.post("/org/{orgSlug}/invoice/createSale", {
        params: { path: { orgSlug } },
        body: value,
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

  const [invoiceItems, invoiceDiscountPercent, invoiceDiscountAmount] = useStore(
    form.store,
    (state) => [state.values.items, state.values.discountPercent, state.values.discountAmount],
  );

  const handleAddItem = (product: Product) => {
    const existingIndex = invoiceItems.findIndex((i) => i.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...invoiceItems];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + 1,
      };
      form.setFieldValue("items", newItems);
    } else {
      form.pushFieldValue("items", {
        ...product,
        quantity: 1,
        productId: product.id,
        price: product.sellingPrice,
      });
    }

    form.validate("change");
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...form.getFieldValue("items")];
    newItems.splice(index, 1);
    form.setFieldValue("items", newItems);
    form.validate("change");
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    const product = products?.find((p) => p.id === invoiceItems[index].productId);
    if (!product) return;

    const newItems = [...invoiceItems];
    newItems[index] = {
      ...newItems[index],
      quantity: quantity,
    };
    form.setFieldValue("items", newItems);
    form.validate("change");
  };

  const handleUpdateItemField = (
    index: number,
    field: InvoiceItemEditableField,
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

  const handleUpdateInvoiceField = (field: InvoiceEditableField, value: any) => {
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
      />

      <ResizablePanelGroup direction="vertical">
        <ResizablePanel className="p-2 overflow-y-auto!">
          <InvoiceTable
            items={invoiceItems}
            invoiceDiscountAmount={invoiceDiscountAmount}
            invoiceDiscountPercent={invoiceDiscountPercent}
            onUpdateItemQuantity={handleUpdateItemQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateItemField={handleUpdateItemField}
            onUpdateInvoiceField={handleUpdateInvoiceField}
          />

          <div className="mt-2">
            <form.Subscribe children={(state) => <FormErrors formState={state} />} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel className="p-2 overflow-y-auto!" defaultSize={50}>
          <ProductsSidebar products={products} onAdd={handleAddItem} invoiceItems={invoiceItems} />
        </ResizablePanel>
      </ResizablePanelGroup>
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
    <div className="flex justify-between flex-wrap-reverse gap-2 px-2 ">
      <form.Field
        name="customerId"
        children={(field) => <CustomerSelect customers={customers} field={field} />}
      />
      <div className="flex gap-2">
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

// Products sidebar component
function ProductsSidebar({
  products,
  onAdd,
  invoiceItems,
}: {
  products: Product[] | undefined;
  onAdd: (item: Product) => void;
  invoiceItems: InvoiceItem[];
}) {
  const { t } = useTranslation();
  const [productFilter, setProductFilter] = useState("");

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productFilter) return products;

    return products.filter((product) =>
      product.description.toLowerCase().includes(productFilter.toLowerCase()),
    );
  }, [products, productFilter]);

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder={t("product.search")}
        value={productFilter}
        onChange={(e) => setProductFilter(e.target.value)}
      />
      <Separator orientation="horizontal" />
      <div className="flex flex-wrap gap-2">
        {filteredProducts.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            onAdd={onAdd}
            invoiceItems={invoiceItems}
          />
        ))}
      </div>
    </div>
  );
}

// Individual product item component
function ProductItem({
  product,
  onAdd,
  invoiceItems,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  invoiceItems: InvoiceItem[];
}) {
  const { t } = useTranslation();

  const matchingInvoiceItem = invoiceItems.find((i) => i.id == product.id);
  const remainingStock = product.stockQuantity - (matchingInvoiceItem?.quantity || 0);

  return (
    <Button
      disabled={remainingStock <= 0}
      type="button"
      variant="ghost"
      className="bg-card hover:bg-secondary! flex-1 h-fit w-fit border flex flex-col items-center gap-5"
      onClick={() => onAdd(product)}
    >
      <h3>{product.description}</h3>
      <div className="w-full text-xs text-secondary-foreground/50 flex justify-around gap-2">
        <span className="text-chart-5">
          {t("common.form.price")}: {product.sellingPrice}
        </span>
        <span className="text-chart-2">
          {t("product.stock")}: {product.stockQuantity}
        </span>
        <span className="text-chart-4">
          {t("product.remaining")}: {remainingStock}
        </span>
      </div>
    </Button>
  );
}

// Main invoice table component
function InvoiceTable({
  items,
  invoiceDiscountPercent,
  invoiceDiscountAmount,
  onUpdateItemQuantity,
  onRemoveItem,
  onUpdateItemField,
  onUpdateInvoiceField,
}: {
  items: InvoiceItem[];
  invoiceDiscountPercent?: number;
  invoiceDiscountAmount?: string;
  onUpdateItemQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItemField: (
    index: number,
    field: InvoiceItemEditableField,
    value: number | string,
  ) => void;
  onUpdateInvoiceField: (field: InvoiceEditableField, value: any) => void;
}) {
  const { t } = useTranslation();

  // Calculate subtotal (before invoice-level discounts)
  const subtotal = useMemo(() => calculateInvoiceSubtotal(items, "SALE"), [items]);

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="*:font-bold">
            <TableHead>{t("common.ui.number")}</TableHead>
            <TableHead>{t("common.form.barcode")}</TableHead>
            <TableHead className="w-full">{t("common.form.description")}</TableHead>
            <TableHead>{t("common.form.quantity")}</TableHead>
            <TableHead>{t("common.form.price")}</TableHead>
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
                onUpdateQuantity={onUpdateItemQuantity}
                onUpdateField={onUpdateItemField}
                onRemove={onRemoveItem}
              />
            ))
          )}
        </TableBody>

        <InvoiceTableFooter
          subtotal={subtotal}
          discountPercent={invoiceDiscountPercent}
          discountAmount={invoiceDiscountAmount}
          onUpdateInvoiceField={onUpdateInvoiceField}
        />
      </Table>
    </div>
  );
}

// Invoice table row component
function InvoiceTableRow({
  item,
  index,
  onUpdateQuantity,
  onUpdateField,
  onRemove,
}: {
  item: InvoiceItem;
  index: number;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateField: (index: number, field: InvoiceItemEditableField, value: number | string) => void;
  onRemove: (index: number) => void;
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
      <TableCell>{item.bardcode}</TableCell>
      <TableCell>{item.description}</TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(index, e.target.valueAsNumber)}
          min={1}
          max={item.stockQuantity}
        />
      </TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={new SafeDecimal(item.price).toNumber()}
          onChange={(e) => onUpdateField(index, "price", e.target.value)}
          min={0}
        />
      </TableCell>
      <TableCell>{formatMoney(itemSubtotal)}</TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={item.discountPercent || 0}
          onChange={(e) => onUpdateField(index, "discountPercent", e.target.valueAsNumber)}
          min={0}
          max={100}
        />
      </TableCell>
      <TableCell>{formatMoney(percentDiscount)}</TableCell>
      <TableCell>
        <InputNumpad
          className="w-20"
          value={new SafeDecimal(item.discountAmount || 0).toNumber()}
          onChange={(e) => onUpdateField(index, "discountAmount", e.target.value)}
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
  onUpdateInvoiceField,
}: {
  subtotal: Decimal;
  discountPercent?: number;
  discountAmount?: string;
  onUpdateInvoiceField: (field: InvoiceEditableField, value: number | string) => void;
}) {
  const { t } = useTranslation();

  const percentDiscount = calculateInvoicePercentDiscount(subtotal, discountPercent);
  const totalPrice = calculateInvoiceTotal(subtotal, discountPercent, discountAmount);

  return (
    <TableFooter className="*:*:font-bold">
      <TableRow>
        <TableCell colSpan={9}>{t("invoice.subtotal")}</TableCell>
        <TableCell className="text-end">{formatMoney(subtotal)}</TableCell>
        <TableCell></TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5}></TableCell>
        <TableCell>{t("invoice.discountPercent")}</TableCell>
        <TableCell>
          <InputNumpad
            className="w-20"
            value={discountPercent}
            onChange={(e) => onUpdateInvoiceField("discountPercent", e.target.valueAsNumber)}
            min={0}
            max={100}
          />
        </TableCell>
        <TableCell>{formatMoney(percentDiscount)}</TableCell>
        <TableCell>{t("invoice.discountAmount")}</TableCell>
        <TableCell>
          <InputNumpad
            className="w-20"
            value={new SafeDecimal(discountAmount || 0).toNumber()}
            onChange={(e) => onUpdateInvoiceField("discountAmount", e.target.value)}
            min={0}
            max={subtotal.toNumber()}
          />
        </TableCell>
        <TableCell></TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={9}>{t("invoice.total")}</TableCell>
        <TableCell className="text-end text-green-300">{formatMoney(totalPrice)}</TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableFooter>
  );
}

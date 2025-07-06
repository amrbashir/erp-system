import {
  CreateInvoiceDto,
  CreateInvoiceItemDto,
  CustomerEntity,
  ProductEntity,
} from "@erp-system/sdk/zod";
import { formatCurrency, toBaseUnits, toMajorUnits } from "@erp-system/utils";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  ReceiptTextIcon,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/components/ui/command";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/components/ui/popover";
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
import { cn } from "@/shadcn/lib/utils";

import type { AnyFieldApi } from "@tanstack/react-form";
import type z from "zod";

import { apiClient } from "@/api-client";
import { FormErrors } from "@/components/form-errors";
import { InputNumber } from "@/components/input-number";
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/invoices/create")({
  component: CreateInvoice,
  context: () => ({
    title: i18n.t("routes.createInvoice"),
    icon: ReceiptTextIcon,
  }),
});

type CreateInvoiceItem = z.infer<typeof CreateInvoiceItemDto>;

type Product = z.infer<typeof ProductEntity>;
type Customer = z.infer<typeof CustomerEntity>;
type Invoice = z.infer<ReturnType<(typeof CreateInvoiceDto)["strict"]>> & {
  items?: (CreateInvoiceItem & Product)[];
};
type InvoiceItem = Invoice["items"][number];

function CreateInvoice() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

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
      discount_percent: 0,
      discount_amount: 0,
    } as Invoice,
    validators: {
      onSubmit: ({ value, formApi }) => {
        if (value.items.length === 0) return "invoiceMustHaveItems";

        const errors = formApi.parseValuesWithSchema(CreateInvoiceDto as any);
        if (errors) return errors;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await apiClient.post("/org/{orgSlug}/invoice/create", {
        params: { path: { orgSlug } },
        body: value,
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      toast.success(t("invoice.createdSuccessfully"));
      client.invalidateQueries({ queryKey: ["invoices"] });
      navigate({ to: "/org/$orgSlug/invoices", params: { orgSlug } });
    },
  });

  const [invoiceItems, invoiceDiscountPercent, invoiceDiscountAmount] = useStore(
    form.store,
    (state) => [state.values.items, state.values.discount_percent, state.values.discount_amount],
  );

  const addItem = (product: Product) => {
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
      });
    }

    form.validate("change");
  };

  const removeItem = (index: number) => {
    const newItems = [...form.getFieldValue("items")];
    newItems.splice(index, 1);
    form.setFieldValue("items", newItems);
    form.validate("change");
  };

  const updateItemQuantity = (index: number, quantity: number) => {
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

  const updateItemDiscount = (
    index: number,
    field: "discount_percent" | "discount_amount",
    value: number,
  ) => {
    const newItems = [...invoiceItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    form.setFieldValue("items", newItems);
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
      <div className="flex justify-between gap-2 px-2">
        <form.Field
          name="customerId"
          children={(field) => <CustomerSelect customers={customers} field={field} />}
        />

        <div className="flex gap-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <>
                <Button
                  type="button"
                  disabled={!canSubmit}
                  variant="secondary"
                  onClick={() => router.history.back()}
                >
                  {t("common.actions.cancel")}
                </Button>
                <Button type="submit" disabled={!canSubmit || invoiceItems.length === 0}>
                  {isSubmitting && <Loader2Icon className="animate-spin" />}
                  {t("common.actions.create")}
                </Button>
              </>
            )}
          />
        </div>
      </div>

      <ResizablePanelGroup direction="vertical">
        <ResizablePanel className="p-2 overflow-y-auto!">
          <InvoiceTable
            items={invoiceItems}
            invoiceDiscountAmount={invoiceDiscountAmount}
            invoiceDiscountPercent={invoiceDiscountPercent}
            updateItemQuantity={updateItemQuantity}
            removeItem={removeItem}
            updateItemDiscount={updateItemDiscount}
            updateInvoiceDiscount={(field, value) => {
              form.setFieldValue(field, value);
              form.validate("change");
            }}
          />

          <div className="mt-2">
            <FormErrors formState={form.state} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel className="p-2 overflow-y-auto!" defaultSize={50}>
          <ProductsSidebar products={products} onAdd={addItem} invoiceItems={invoiceItems} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </form>
  );
}

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

function ProductItem({
  product,
  onAdd,
  invoiceItems,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  invoiceItems: InvoiceItem[];
}) {
  const { t, i18n } = useTranslation();

  const matchingInvoiceItem = invoiceItems.find((i) => i.id == product.id);
  const remainingStock = product.stock_quantity - (matchingInvoiceItem?.quantity ?? 0);

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
          {t("common.form.price")}: {formatCurrency(product.selling_price, "EGP", i18n.language)}
        </span>
        <span className="text-chart-2">
          {t("product.stock")}: {product.stock_quantity}
        </span>
        <span className="text-chart-4">
          {t("product.remaining")}: {remainingStock}
        </span>
      </div>
    </Button>
  );
}

function CustomerSelect({
  customers = [],
  field,
}: {
  customers: Customer[] | undefined;
  field: AnyFieldApi;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Label htmlFor={field.name}>{t("customer.name")}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {field.state.value
              ? customers?.find((c) => c.id === field.state.value)?.name
              : t("customer.select")}
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={t("customer.search")} className="h-9" />
            <CommandList>
              <CommandEmpty>{t("customer.nothing")}</CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => {
                      field.handleChange(customer.id);
                      setOpen(false);
                    }}
                  >
                    {customer.name}
                    <CheckIcon
                      className={cn(
                        "ml-auto",
                        field.state.value === customer.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function InvoiceTable({
  items,
  invoiceDiscountPercent = 0,
  invoiceDiscountAmount = 0,
  updateItemQuantity,
  removeItem,
  updateItemDiscount,
  updateInvoiceDiscount,
}: {
  items: InvoiceItem[];
  invoiceDiscountPercent?: number;
  invoiceDiscountAmount?: number;
  updateItemQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
  updateItemDiscount: (
    index: number,
    field: "discount_percent" | "discount_amount",
    value: number,
  ) => void;
  updateInvoiceDiscount: (field: "discount_percent" | "discount_amount", value: any) => void;
}) {
  const { t, i18n } = useTranslation();

  // Calculate subtotal (before invoice-level discounts)
  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const itemSubtotal = item.selling_price! * item.quantity;
        const percentDiscount = ((item.discount_percent || 0) / 100) * itemSubtotal;
        const itemTotal = Math.round(itemSubtotal - percentDiscount - (item.discount_amount || 0));
        return total + itemTotal;
      }, 0),
    [items],
  );

  // Calculate final total after all discounts
  const percentDiscount = (subtotal * invoiceDiscountPercent) / 100;
  const totalPrice = Math.round(Math.max(0, subtotal - percentDiscount - invoiceDiscountAmount));

  return (
    <div className="border rounded-lg">
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="*:font-bold">
              <TableHead>{t("common.ui.number")}</TableHead>
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
            {items.map((item, index) => {
              const itemSubtotal = item.selling_price * item.quantity;
              const itemPercentDiscount = (itemSubtotal * (item.discount_percent || 0)) / 100;
              const itemTotal = Math.round(
                itemSubtotal - itemPercentDiscount - (item.discount_amount || 0),
              );

              return (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <InputNumber
                      className="w-20"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                      min={1}
                      max={item.stock_quantity}
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(item.selling_price, "EGP", i18n.language)}</TableCell>
                  <TableCell>
                    {formatCurrency(item.selling_price * item.quantity, "EGP", i18n.language)}
                  </TableCell>
                  <TableCell>
                    <InputNumber
                      className="w-20"
                      value={item.discount_percent || 0}
                      onChange={(e) =>
                        updateItemDiscount(index, "discount_percent", Number(e.target.value))
                      }
                      min={0}
                      max={100}
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(itemPercentDiscount, "EGP", i18n.language)}</TableCell>
                  <TableCell>
                    <InputNumber
                      className="w-20"
                      value={toMajorUnits(item.discount_amount || 0)}
                      onChange={(e) =>
                        updateItemDiscount(
                          index,
                          "discount_amount",
                          toBaseUnits(Number(e.target.value)),
                        )
                      }
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    {formatCurrency(itemTotal, "EGP", i18n.language)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <TrashIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter className="*:*:font-bold">
            <TableRow>
              <TableCell colSpan={8}>{t("invoice.subtotal")}</TableCell>
              <TableCell className="text-end">
                {formatCurrency(subtotal, "EGP", i18n.language)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4}></TableCell>
              <TableCell>{t("invoice.discountPercent")}</TableCell>
              <TableCell>
                <InputNumber
                  className="w-20"
                  value={invoiceDiscountPercent}
                  onChange={(e) =>
                    updateInvoiceDiscount("discount_percent", Number(e.target.value))
                  }
                  min={0}
                  max={100}
                />
              </TableCell>
              <TableCell>{formatCurrency(percentDiscount, "EGP", i18n.language)}</TableCell>
              <TableCell>{t("invoice.discountAmount")}</TableCell>
              <TableCell>
                <InputNumber
                  className="w-20"
                  value={toMajorUnits(invoiceDiscountAmount)}
                  onChange={(e) =>
                    updateInvoiceDiscount("discount_amount", toBaseUnits(Number(e.target.value)))
                  }
                  min={0}
                />
              </TableCell>
              <TableCell></TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={8}>{t("invoice.total")}</TableCell>
              <TableCell className="text-end">
                {formatCurrency(totalPrice, "EGP", i18n.language)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      ) : (
        <div className="p-4 text-center text-secondary-foreground/50">
          {t("invoice.addItemsTo")}
        </div>
      )}
    </div>
  );
}

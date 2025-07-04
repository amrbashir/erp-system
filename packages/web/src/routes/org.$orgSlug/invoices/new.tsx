import { CreateInvoiceDto, CustomerEntity, ProductEntity } from "@erp-system/sdk/zod";
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
import { useOrg } from "@/hooks/use-org";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/invoices/new")({
  component: CreateInvoice,
  context: () => ({
    title: i18n.t("pages.createInvoice"),
    icon: ReceiptTextIcon,
  }),
});

type Product = z.infer<typeof ProductEntity>;
type Customer = z.infer<typeof CustomerEntity>;
type InvoiceItem = z.infer<typeof CreateInvoiceDto>["items"][number] & Product;
type Invoice = {
  items: InvoiceItem[];
  customerId?: number;
};

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

      toast.success(t("invoiceCreatedSuccessfully"));
      client.invalidateQueries({ queryKey: ["invoices"] });
      navigate({ to: "/org/$orgSlug/invoices", params: { orgSlug } });
    },
  });

  const invoiceItems = useStore(form.store, (state) => state.values.items);

  const addProduct = (product: Product) => {
    const existingIndex = invoiceItems.findIndex((item) => item.productId === product.id);
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

  const removeProduct = (index: number) => {
    const newItems = [...form.getFieldValue("items")];
    newItems.splice(index, 1);
    form.setFieldValue("items", newItems);
    form.validate("change");
  };

  const updateProductQuantity = (index: number, quantity: number) => {
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

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel className="p-2" defaultSize={30}>
        <ProductsSidebar products={products} onAdd={addProduct} invoiceItems={invoiceItems} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="p-2">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="customerId"
            children={(field) => <CustomerSelect customers={customers} field={field} />}
          />

          <InvoiceTable
            items={invoiceItems}
            updateProductQuantity={updateProductQuantity}
            removeProduct={removeProduct}
          />

          <FormErrors formState={form.state} />

          <div className="flex justify-end gap-2">
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
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={!canSubmit}>
                    {isSubmitting && <Loader2Icon className="animate-spin" />}
                    {t("create")}
                  </Button>
                </>
              )}
            />
          </div>
        </form>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ProductsSidebar({
  products,
  onAdd,
  invoiceItems,
}: {
  products: Product[] | undefined;
  onAdd: (product: Product) => void;
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
        placeholder={t("searchProducts")}
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
  const { t } = useTranslation();

  const matchingInvoiceItem = invoiceItems.find((i) => i.id == product.id);
  const remainingStock = product.stock_quantity - (matchingInvoiceItem?.quantity ?? 0);

  return (
    <Button
      disabled={remainingStock <= 0}
      variant="ghost"
      className="bg-card hover:bg-secondary! flex-1 h-fit w-fit border flex flex-col items-center gap-5"
      onClick={() => onAdd(product)}
    >
      <h3>{product.description}</h3>
      <div className="w-full text-xs text-secondary-foreground/50 flex justify-between gap-2">
        <span className="text-blue-300">
          {t("stock")}: {product.stock_quantity}
        </span>
        <span className="text-red-300">
          {t("remaining")}: {remainingStock}
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
      <Label htmlFor={field.name}>{t("customerName")}</Label>
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
              : t("selectCustomer")}
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={t("searchCustomers")} className="h-9" />
            <CommandList>
              <CommandEmpty>{t("noCustomers")}</CommandEmpty>
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
  updateProductQuantity,
  removeProduct,
}: {
  items: InvoiceItem[];
  updateProductQuantity: (index: number, quantity: number) => void;
  removeProduct: (index: number) => void;
}) {
  const { t } = useTranslation();

  const totalPrice = useMemo(
    () => items.reduce((total, item) => total + item.selling_price! * item.quantity, 0),
    [items],
  );

  return (
    <div className="border rounded-lg">
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="*:font-bold">
              <TableHead className="w-full">{t("description")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("sellingPrice")}</TableHead>
              <TableHead className="text-end!">{t("total")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <Input
                    className="w-20"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateProductQuantity(index, Number(e.target.value))}
                    min={1}
                    max={item.stock_quantity}
                  />
                </TableCell>
                <TableCell>{item.selling_price}</TableCell>
                <TableCell className="text-end">
                  {(item.selling_price! * item.quantity).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    onClick={() => removeProduct(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <TrashIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>{t("total")}</TableCell>
              <TableCell className="text-end">{totalPrice}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      ) : (
        <div className="p-4 text-center text-secondary-foreground/50">{t("addItemsToInvoice")}</div>
      )}
    </div>
  );
}

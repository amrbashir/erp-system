import { CreatePurchaseInvoiceDto, CreatePurchaseInvoiceItemDto } from "@erp-system/sdk/zod";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";

import type { AnyFieldApi } from "@tanstack/react-form";
import type z from "zod";

import { InputNumpad } from "@/components/ui/input-numpad";

import { FormErrors, FormFieldError } from "./form-errors";

type CreateInvoiceItem = z.infer<typeof CreatePurchaseInvoiceItemDto>;
type Invoice = z.infer<ReturnType<(typeof CreatePurchaseInvoiceDto)["strict"]>> & {
  items?: CreateInvoiceItem[];
};
type InvoiceItem = Invoice["items"][number];

export function AddProductDialog({
  onProductSubmit,
  ...props
}: { onProductSubmit: (product: InvoiceItem) => void } & React.ComponentProps<"button">) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      barcode: "",
      quantity: 1,
      description: "",
      purchasePrice: "0",
      sellingPrice: "0",
      discountPercent: 0,
      discountAmount: "0",
    } as InvoiceItem,
    validators: {
      onSubmit: CreatePurchaseInvoiceItemDto,
    },
    onSubmit: async ({ value, formApi }) => {
      onProductSubmit(value);
      formApi.reset();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...props}>{t("product.add")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("product.add")}</DialogTitle>
          <DialogDescription>{t("product.addDescription")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="barcode" children={(field) => <InputField field={field} />} />
          <form.Field name="description" children={(field) => <InputField field={field} />} />
          <form.Field
            name="quantity"
            children={(field) => <InputField type="number" min={1} field={field} />}
          />
          <form.Field
            name="purchasePrice"
            children={(field) => <InputField type="number" isString min={0} field={field} />}
          />
          <form.Field
            name="sellingPrice"
            children={(field) => <InputField type="number" isString min={0} field={field} />}
          />

          <form.Subscribe children={(state) => <FormErrors formState={state} />} />

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <>
                  <DialogClose asChild>
                    <Button disabled={isSubmitting} variant="outline" onClick={() => form.reset()}>
                      {t("common.actions.cancel")}
                    </Button>
                  </DialogClose>
                  <Button disabled={!canSubmit}>{t("common.actions.add")}</Button>
                </>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InputField({
  field,
  isString = false,
  ...props
}: { field: AnyFieldApi; isString?: boolean } & React.ComponentProps<"input">) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={field.name}>{t(`invoice.form.${field.name}` as any)}</Label>
      {props.type === "number" ? (
        <InputNumpad
          id={field.name}
          name={field.name}
          value={field.state.value}
          onChange={(e) => {
            if (isString) {
              field.handleChange(e.target.value);
            } else {
              field.handleChange(e.target.valueAsNumber);
            }
          }}
          {...props}
        />
      ) : (
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          {...props}
        />
      )}
      <FormFieldError field={field} />
    </div>
  );
}

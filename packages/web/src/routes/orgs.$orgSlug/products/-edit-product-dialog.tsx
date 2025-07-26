import { ProductEntity, UpdateProductDto } from "@erp-system/sdk/zod";
import { Slot } from "@radix-ui/react-slot";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { EditIcon, Loader2Icon } from "lucide-react";
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
import { cn } from "@/shadcn/lib/utils";

import type z from "zod";

import { apiClient } from "@/api-client";
import { InputNumpad } from "@/components/ui/input-numpad";
import { useAuthUser } from "@/hooks/use-auth-user";

import { FormErrors, FormFieldError } from "../../../components/form-errors";

type Product = z.infer<typeof ProductEntity>;

export function EditProductDialog({
  product,
  iconOnly = false,
  asMenuItem = false,
}: {
  product: Product;
  iconOnly?: boolean;
  asMenuItem?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { orgSlug } = useAuthUser();
  const client = useQueryClient();

  const form = useForm({
    defaultValues: {
      barcode: product?.barcode || "",
      description: product?.description || "",
      purchasePrice: product?.purchasePrice || "0",
      sellingPrice: product?.sellingPrice || "0",
      stockQuantity: product?.stockQuantity || 0,
    } as z.infer<typeof UpdateProductDto>,
    validators: {
      onSubmit: UpdateProductDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await apiClient.post("/orgs/{orgSlug}/products/{id}/update", {
        params: { path: { orgSlug: orgSlug, id: product.id } },
        body: value,
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      client.invalidateQueries({ queryKey: ["products", orgSlug] });

      formApi.reset();
      setOpen(false);
    },
  });

  const actionLabel = t("product.edit");
  const actionLabelShort = t("common.actions.edit");
  const actionDescription = t("product.editDescription");

  const Trigger = (
    <Button variant="ghost" className={cn(asMenuItem && "w-full h-full justify-start")}>
      {iconOnly && <EditIcon />}
      {actionLabel}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{Trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>{actionDescription}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="barcode"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`product.form.${field.name}` as any)}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FormFieldError field={field} />
              </div>
            )}
          />
          <form.Field
            name="description"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`product.form.${field.name}` as any)}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FormFieldError field={field} />
              </div>
            )}
          />
          <form.Field
            name="stockQuantity"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`product.form.${field.name}` as any)}</Label>
                <InputNumpad
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                  min={0}
                />
                <FormFieldError field={field} />
              </div>
            )}
          />
          <form.Field
            name="purchasePrice"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`product.form.${field.name}` as any)}</Label>
                <InputNumpad
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  min={0}
                />
                <FormFieldError field={field} />
              </div>
            )}
          />
          <form.Field
            name="sellingPrice"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`product.form.${field.name}` as any)}</Label>
                <InputNumpad
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  min={0}
                />
                <FormFieldError field={field} />
              </div>
            )}
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
                  <Button disabled={!canSubmit}>
                    {isSubmitting && <Loader2Icon className="animate-spin" />}
                    {actionLabelShort}
                  </Button>
                </>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

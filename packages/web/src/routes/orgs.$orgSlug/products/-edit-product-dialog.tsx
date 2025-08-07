import { UpdateProductDto } from "@erp-system/server/dto";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/components/ui/button.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/components/ui/dialog.tsx";
import { Input } from "@/shadcn/components/ui/input.tsx";
import { Label } from "@/shadcn/components/ui/label.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

import type { Product } from "@erp-system/server/prisma";
import type z from "zod";

import { FormErrors, FormFieldError } from "@/components/form-errors.tsx";
import { InputNumpad } from "@/components/ui/input-numpad.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { trpc } from "@/trpc.ts";

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

  const {
    mutateAsync: updateProduct,
    isError: updateProductIsError,
    error: updateProductError,
  } = useMutation(trpc.orgs.products.update.mutationOptions());

  const form = useForm({
    defaultValues: {
      barcode: product.barcode,
      description: product.description,
      purchasePrice: product.purchasePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      stockQuantity: product.stockQuantity,
    } as z.infer<typeof UpdateProductDto>,
    validators: {
      onSubmit: UpdateProductDto,
    },
    onSubmit: async ({ value, formApi }) => {
      await updateProduct({ ...value, orgSlug, productId: product.id });

      if (updateProductIsError) {
        formApi.setErrorMap({ onSubmit: updateProductError as any });
        return;
      }

      client.invalidateQueries({ queryKey: trpc.orgs.products.getAll.queryKey() });

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
                <Label htmlFor={field.name}>{t(`product.form.${field.name}`)}</Label>
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
                <Label htmlFor={field.name}>{t(`product.form.${field.name}`)}</Label>
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
                <Label htmlFor={field.name}>{t(`product.form.${field.name}`)}</Label>
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
                <Label htmlFor={field.name}>{t(`product.form.${field.name}`)}</Label>
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
                <Label htmlFor={field.name}>{t(`product.form.${field.name}`)}</Label>
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

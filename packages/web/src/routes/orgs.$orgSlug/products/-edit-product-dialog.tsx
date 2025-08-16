import { UpdateProductDto } from "@erp-system/server/product/product.dto.ts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditIcon, Loader2Icon } from "lucide-react";
import React from "react";
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

import type { Product } from "@erp-system/server/prisma/index.ts";
import type z from "zod";

import { ErrorElement } from "@/components/error-element.tsx";
import { InputNumpad } from "@/components/ui/input-numpad.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { trpc } from "@/trpc.ts";

export function EditProductDialog({
  product,
  iconOnly = false,
  asMenuItem = false,
  shortLabel = false,
}: {
  product: Product;
  iconOnly?: boolean;
  asMenuItem?: boolean;
  shortLabel?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const { orgSlug } = useAuthUser();
  const client = useQueryClient();

  const { mutateAsync: updateProduct, error: updateProductError } = useMutation(
    trpc.orgs.products.update.mutationOptions({
      onSuccess: () => {
        client.invalidateQueries({ queryKey: trpc.orgs.products.getAll.queryKey() });
        setOpen(false);
      },
    }),
  );

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
    onSubmit: ({ value }) => updateProduct({ ...value, orgSlug, productId: product.id }),
  });

  const actionLabel = t("product.edit");
  const actionLabelShort = t("common.actions.edit");
  const actionDescription = t("product.editDescription");

  const Trigger = (
    <Button variant="ghost" className={cn(asMenuItem && "w-full h-full justify-start")}>
      {iconOnly && <EditIcon />}
      {shortLabel ? actionLabelShort : actionLabel}
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        form.reset();
      }}
    >
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
            children={(field) => {
              const fieldName = t(`product.form.${field.name}`);
              return (
                <div className="flex flex-col gap-3">
                  <Label htmlFor={field.name}>{fieldName}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors
                    .filter((e) => !!e)
                    .map((error, index) => (
                      <ErrorElement key={index} error={error} fieldName={fieldName} />
                    ))}
                </div>
              );
            }}
          />
          <form.Field
            name="description"
            children={(field) => {
              const fieldName = t(`product.form.${field.name}`);
              return (
                <div className="flex flex-col gap-3">
                  <Label htmlFor={field.name}>{fieldName}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors
                    .filter((e) => !!e)
                    .map((error, index) => (
                      <ErrorElement key={index} error={error} fieldName={fieldName} />
                    ))}
                </div>
              );
            }}
          />
          <form.Field
            name="stockQuantity"
            children={(field) => {
              const fieldName = t(`product.form.${field.name}`);
              return (
                <div className="flex flex-col gap-3">
                  <Label htmlFor={field.name}>{fieldName}</Label>
                  <InputNumpad
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    min={0}
                  />
                  {field.state.meta.errors
                    .filter((e) => !!e)
                    .map((error, index) => (
                      <ErrorElement key={index} error={error} fieldName={fieldName} />
                    ))}
                </div>
              );
            }}
          />
          <form.Field
            name="purchasePrice"
            children={(field) => {
              const fieldName = t(`product.form.${field.name}`);
              return (
                <div className="flex flex-col gap-3">
                  <Label htmlFor={field.name}>{fieldName}</Label>
                  <InputNumpad
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    min={0}
                  />
                  {field.state.meta.errors
                    .filter((e) => !!e)
                    .map((error, index) => (
                      <ErrorElement key={index} error={error} fieldName={fieldName} />
                    ))}
                </div>
              );
            }}
          />
          <form.Field
            name="sellingPrice"
            children={(field) => {
              const fieldName = t(`product.form.${field.name}`);
              return (
                <div className="flex flex-col gap-3">
                  <Label htmlFor={field.name}>{fieldName}</Label>
                  <InputNumpad
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    min={0}
                  />
                  {field.state.meta.errors
                    .filter((e) => !!e)
                    .map((error, index) => (
                      <ErrorElement key={index} error={error} fieldName={fieldName} />
                    ))}
                </div>
              );
            }}
          />

          {updateProductError && <ErrorElement error={updateProductError} />}

          <DialogFooter>
            <form.Subscribe
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <>
                  <DialogClose asChild>
                    <Button disabled={isSubmitting} variant="outline">
                      {t("common.actions.cancel")}
                    </Button>
                  </DialogClose>
                  <Button disabled={isSubmitting}>
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

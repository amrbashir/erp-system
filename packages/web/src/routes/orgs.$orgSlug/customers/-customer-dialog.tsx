import { CreateCustomerDto, UpdateCustomerDto } from "@erp-system/server/customer/customer.dto.ts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditIcon, Loader2Icon, PlusIcon } from "lucide-react";
import * as React from "react";
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

import type { Customer } from "@erp-system/server/prisma/index.ts";
import type z from "zod";

import { FormErrors, FormFieldError } from "@/components/form-errors.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { trpc } from "@/trpc.ts";

export function CustomerDialog({
  action,
  shortLabel = false,
  iconOnly = false,
  customer,
  onCreated,
  onEdited,
}: {
  action: "create" | "edit";
  shortLabel?: boolean;
  iconOnly?: boolean;
  customer?: Customer;
  onCreated?: (customer: Customer) => void;
  onEdited?: () => void;
}) {
  const { orgSlug } = useAuthUser();
  const { t } = useTranslation();
  const client = useQueryClient();

  const [open, setOpen] = React.useState(false);

  const {
    mutateAsync: createCustomerHandler,
    isError: createCustomerIsError,
    error: createCustomerError,
  } = useMutation(trpc.orgs.customers.create.mutationOptions());

  const {
    mutateAsync: updateCustomerHandler,
    isError: updateCustomerIsError,
    error: updateCustomerError,
  } = useMutation(trpc.orgs.customers.update.mutationOptions());

  const ActionDto = action === "create" ? CreateCustomerDto : UpdateCustomerDto;

  const form = useForm({
    defaultValues: {
      name: customer?.name,
      address: customer?.address,
      phone: customer?.phone,
    } as z.infer<typeof ActionDto>,
    validators: {
      onSubmit: ActionDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const actionIsError = action === "create" ? createCustomerIsError : updateCustomerIsError;
      const actionError = action === "create" ? createCustomerError : updateCustomerError;

      const data =
        action === "create"
          ? await createCustomerHandler({ ...value, name: value.name!, orgSlug })
          : await updateCustomerHandler({ ...value, orgSlug, customerId: customer!.id });

      if (actionIsError) {
        formApi.setErrorMap({ onSubmit: actionError as any });
        return;
      }

      if (action === "create" && data && onCreated) {
        onCreated(data);
      }
      if (action === "edit" && data && onEdited) onEdited();

      client.invalidateQueries({ queryKey: trpc.orgs.customers.getAll.queryKey() });
      setOpen(false);
    },
  });

  const actionLabelShort = t(`common.actions.${action}`);
  const actionLabel = shortLabel
    ? actionLabelShort
    : t(`customer.${action === "create" ? "add" : "edit"}`);
  const actionDescription = t(`customer.${action === "create" ? "add" : "edit"}Description`);

  const ActionIcon = action === "create" ? <PlusIcon /> : <EditIcon />;

  const Trigger = iconOnly ? (
    <Button variant="ghost" size="icon" className="p-0">
      {ActionIcon}
    </Button>
  ) : (
    <Button variant={action === "create" ? "default" : "secondary"}>
      {ActionIcon}
      {actionLabel}
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
            name="name"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`common.form.${field.name}`)}</Label>
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
            name="phone"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`common.form.${field.name}`)}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="tel"
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FormFieldError field={field} />
              </div>
            )}
          />
          <form.Field
            name="address"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`common.form.${field.name}`)}</Label>
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

          <form.Subscribe children={(state) => <FormErrors formState={state} />} />

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

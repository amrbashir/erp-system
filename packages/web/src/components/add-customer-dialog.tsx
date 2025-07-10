import { CreateCustomerDto, CustomerEntity } from "@erp-system/sdk/zod";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
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

import { apiClient } from "@/api-client";
import { FormErrors, FormFieldError } from "@/components/form-errors";
import { useOrg } from "@/hooks/use-org";

type Customer = z.infer<typeof CustomerEntity>;

export function AddCustomerDialog({
  trigger,
  initialName,
  onCreated,
}: {
  trigger?: React.ReactNode;
  initialName?: string;
  onCreated?: (customer: Customer) => void;
}) {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();

  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: initialName || "",
      address: undefined,
      phone: undefined,
    } as z.infer<ReturnType<(typeof CreateCustomerDto)["strict"]>>,
    validators: {
      onSubmit: CreateCustomerDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const { error, data } = await apiClient.post("/org/{orgSlug}/customer/create", {
        params: { path: { orgSlug: orgSlug! } },
        body: value,
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      if (data && onCreated) onCreated(data);

      client.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ? trigger : <Button>{t("customer.add")}</Button>}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("customer.add")}</DialogTitle>
          <DialogDescription>{t("customer.addDescription")}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="name" children={(field) => <InputField field={field} />} />
          <form.Field name="phone" children={(field) => <InputField field={field} />} />
          <form.Field name="address" children={(field) => <InputField field={field} />} />

          <form.Subscribe children={(state) => <FormErrors formState={state} />} />

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <>
                  <DialogClose asChild>
                    <Button disabled={isSubmitting} variant="outline">
                      {t("common.actions.cancel")}
                    </Button>
                  </DialogClose>
                  <Button disabled={!canSubmit}>
                    {isSubmitting && <Loader2Icon className="animate-spin" />}
                    {t("common.actions.add")}
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

function InputField({ field, ...props }: { field: AnyFieldApi } & React.ComponentProps<"input">) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={field.name}>{t(`common.form.${field.name}` as any)}</Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        type={field.name === "phone" ? "tel" : "text"}
        onChange={(e) => field.handleChange(e.target.value)}
        {...props}
      />
      <FormFieldError field={field} />
    </div>
  );
}

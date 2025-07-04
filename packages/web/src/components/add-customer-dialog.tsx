import { CreateCustomerDto } from "@erp-system/sdk/zod";
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

export function AddCustomerDialog() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();

  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      address: undefined,
      phone: undefined,
    } as z.infer<ReturnType<(typeof CreateCustomerDto)["strict"]>>,
    validators: {
      onSubmit: CreateCustomerDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await apiClient.post("/org/{orgSlug}/customer/create", {
        params: { path: { orgSlug: orgSlug! } },
        body: value,
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

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
        <Button>{t("addCustomer")}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addCustomer")}</DialogTitle>
          <DialogDescription>{t("addUserDescription")}</DialogDescription>
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

          <FormErrors formState={form.state} />

          <DialogFooter>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <>
                  <DialogClose asChild>
                    <Button disabled={!canSubmit} variant="outline">
                      {t("cancel")}
                    </Button>
                  </DialogClose>
                  <Button disabled={!canSubmit} type="submit">
                    {isSubmitting && <Loader2Icon className="animate-spin" />}
                    {t("add")}
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

function InputField({ field }: { field: AnyFieldApi }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={field.name}>{t(field.name as any)}</Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <FormFieldError field={field} />
    </div>
  );
}

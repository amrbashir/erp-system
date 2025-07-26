import { AddBalanceDto } from "@erp-system/sdk/zod";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
import * as React from "react";
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
import { Label } from "@/shadcn/components/ui/label";

import type z from "zod";

import { apiClient } from "@/api-client";
import { InputNumpad } from "@/components/ui/input-numpad";
import { useAuthUser } from "@/hooks/use-auth-user";

import { FormErrors, FormFieldError } from "../../../components/form-errors";

export function AddBalanceDialog({ shortLabel = false }: { shortLabel?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const { orgSlug } = useAuthUser();
  const client = useQueryClient();

  const form = useForm({
    defaultValues: {
      amount: "0",
    } as z.infer<typeof AddBalanceDto>,
    validators: {
      onSubmit: AddBalanceDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await apiClient.post("/orgs/{orgSlug}/addBalance", {
        params: { path: { orgSlug: orgSlug } },
        body: value,
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      client.invalidateQueries({ queryKey: ["organizationOverview", orgSlug] });
      formApi.reset();
      setOpen(false);
    },
  });

  const actionLabelShort = t("common.actions.add");
  const actionLabel = shortLabel ? actionLabelShort : t("org.addBalance");
  const actionDescription = t("org.addBalanceDescription");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusIcon />
          {actionLabel}
        </Button>
      </DialogTrigger>
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
            name="amount"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`common.form.${field.name}` as any)}</Label>
                <InputNumpad
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

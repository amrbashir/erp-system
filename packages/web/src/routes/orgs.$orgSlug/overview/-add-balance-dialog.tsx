import { AddBalanceDto } from "@erp-system/server/org/org.dto.ts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
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
import { Label } from "@/shadcn/components/ui/label.tsx";

import type z from "zod";

import { FormErrors, FormFieldError } from "@/components/form-errors.tsx";
import { InputNumpad } from "@/components/ui/input-numpad.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { trpc } from "@/trpc.ts";

export function AddBalanceDialog({ shortLabel = false }: { shortLabel?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const { orgSlug } = useAuthUser();
  const client = useQueryClient();

  const {
    mutateAsync: addBalance,
    isError: addBalanceIsError,
    error: addBalanceError,
  } = useMutation(trpc.orgs.addBalance.mutationOptions());

  const form = useForm({
    defaultValues: {
      amount: "0",
    } as z.infer<typeof AddBalanceDto>,
    validators: {
      onSubmit: AddBalanceDto,
    },
    onSubmit: async ({ value, formApi }) => {
      await addBalance({ ...value, orgSlug });

      if (addBalanceIsError) {
        formApi.setErrorMap({ onSubmit: addBalanceError as any });
        return;
      }

      client.invalidateQueries({ queryKey: trpc.orgs.getStatistics.queryKey() });
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
                <Label htmlFor={field.name}>{t(`common.form.${field.name}`)}</Label>
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
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <>
                  <DialogClose asChild>
                    <Button disabled={isSubmitting} variant="outline" onClick={() => form.reset()}>
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

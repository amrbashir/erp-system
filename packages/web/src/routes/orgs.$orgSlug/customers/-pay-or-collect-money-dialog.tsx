import { MoneyTransactionDto } from "@erp-system/server/dto";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2Icon, MinusIcon, PlusIcon } from "lucide-react";
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
import { Label } from "@/shadcn/components/ui/label.tsx";

import type z from "zod";

import { FormErrors, FormFieldError } from "@/components/form-errors.tsx";
import { InputNumpad } from "@/components/ui/input-numpad.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { trpc } from "@/trpc.ts";

export function PayOrCollectMoneyDialog({
  action,
  customerId,
}: {
  customerId: number;
  action: "collect" | "pay";
}) {
  const { orgSlug } = useAuthUser();
  const { t } = useTranslation();
  const client = useQueryClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const {
    mutateAsync: payOrCollectMoney,
    isError: payOrCollectMoneyIsError,
    error: payOrCollectMoneyError,
  } = useMutation(trpc.orgs.customers[`${action}Money`].mutationOptions());

  const form = useForm({
    defaultValues: {
      amount: "0",
    } as z.infer<typeof MoneyTransactionDto>,
    validators: {
      onSubmit: MoneyTransactionDto,
    },
    onSubmit: async ({ value, formApi }) => {
      await payOrCollectMoney({ ...value, orgSlug, customerId });

      if (payOrCollectMoneyIsError) {
        formApi.setErrorMap({ onSubmit: payOrCollectMoneyError as any });
        return;
      }

      client.invalidateQueries({ queryKey: trpc.orgs.customers.getAll.queryKey() });
      router.invalidate({ filter: (r) => r.id === `/orgs/${orgSlug}/customers/${customerId}` });
      setOpen(false);
    },
  });

  const actionLabel = t(`common.actions.${action}`);
  const actionDescription = t(`customer.${action}Description`);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={action === "collect" ? "default" : "destructive"}>
          {action === "collect" ? <PlusIcon /> : <MinusIcon />}
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
                    {actionLabel}
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

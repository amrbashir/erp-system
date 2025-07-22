import { CollectMoneyDto, PayMoneyDto } from "@erp-system/sdk/zod";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2Icon, MinusIcon, PlusIcon } from "lucide-react";
import { act, useState } from "react";
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
import { FormErrors, FormFieldError } from "@/components/form-errors";
import { InputNumpad } from "@/components/ui/input-numpad";
import { useOrg } from "@/hooks/use-org";

export function PayOrCollectMoneyDialog({
  action,
  customerId,
}: {
  customerId: number;
  action: "collect" | "pay";
}) {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const ActionDto = action === "collect" ? CollectMoneyDto : PayMoneyDto;

  const form = useForm({
    defaultValues: {
      amount: "0",
    } as z.infer<ReturnType<(typeof ActionDto)["strict"]>>,
    validators: {
      onSubmit: ActionDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const apiPath =
        `/orgs/{orgSlug}/customers/{id}/${action === "collect" ? "collect" : "pay"}` as const;

      const { error } = await apiClient.post(apiPath, {
        params: { path: { orgSlug: orgSlug, id: customerId } },
        body: value,
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      client.invalidateQueries({ queryKey: ["customers", orgSlug] });
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

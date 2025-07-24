import { CreateUserDto } from "@erp-system/sdk/zod";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";

import type z from "zod";

import type { UserRole } from "@/user";
import { apiClient } from "@/api-client";
import { FormErrors, FormFieldError } from "@/components/form-errors";
import { useOrg } from "@/hooks/use-org";
import { useAuth } from "@/providers/auth";

export function AddUserDialog() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      role: "USER" as UserRole,
    } as z.infer<typeof CreateUserDto>,
    validators: {
      onSubmit: CreateUserDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const { username, password, role } = value;
      const { error } = await apiClient.post("/orgs/{orgSlug}/users/create", {
        params: { path: { orgSlug: orgSlug } },
        body: { username, password, role },
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      client.invalidateQueries({ queryKey: ["users", orgSlug, user?.role] });
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
        <Button>
          <PlusIcon />
          {t("user.add")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("user.add")}</DialogTitle>
          <DialogDescription>{t("user.addDescription")}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="flex w-full items-center gap-2">
            <form.Field
              name="username"
              children={(field) => (
                <div className="w-full flex flex-col gap-3">
                  <Label htmlFor={field.name}>{t(`common.form.${field.name}` as any)}</Label>
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
              name="role"
              children={(field) => (
                <RolesSelector
                  name={field.name}
                  defaultValue="USER"
                  options={["USER", "ADMIN"] as UserRole[]}
                  onChange={(value) => field.handleChange(value as UserRole)}
                />
              )}
            />
          </div>

          <form.Field
            name="password"
            children={(field) => (
              <div className="flex flex-col gap-3">
                <Label htmlFor={field.name}>{t(`common.form.${field.name}` as any)}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  type="password"
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

function RolesSelector({
  name,
  defaultValue,
  options,
  onChange,
}: {
  name?: string;
  defaultValue: string;
  options: string[];
  onChange?: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={name}>{t(`common.form.${name}` as any)}</Label>
      <Select onValueChange={(v) => onChange?.(v)} defaultValue={defaultValue}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((r) => (
            <SelectItem key={r} value={r}>
              {t(`user.roles.${r}` as any)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

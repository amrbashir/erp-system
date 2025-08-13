import { CreateUserDto } from "@erp-system/server/user/user.dto.ts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select.tsx";

import type { UserRole } from "@erp-system/server/prisma/index.ts";
import type z from "zod";

import { ErrorElement } from "@/components/error-element.tsx";
import { useAuthUser } from "@/hooks/use-auth-user.ts";
import { trpc } from "@/trpc.ts";

export function AddUserDialog() {
  const { orgSlug } = useAuthUser();
  const { t } = useTranslation();
  const client = useQueryClient();

  const [open, setOpen] = React.useState(false);

  const {
    mutateAsync: createUser,
    isError: createUserIsError,
    error: createUserError,
  } = useMutation(trpc.orgs.users.create.mutationOptions());

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      role: "USER" as UserRole,
    } as z.infer<typeof CreateUserDto>,
    validators: {
      onSubmit: CreateUserDto,
    },
    onSubmit: async ({ value }) => {
      await createUser({ ...value, orgSlug });

      if (createUserIsError) return;

      client.invalidateQueries({ queryKey: trpc.orgs.users.getAll.queryKey() });
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
              children={(field) => {
                const fieldName = t(`common.form.${field.name}`);

                return (
                  <div className="w-full flex flex-col gap-3">
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
              name="role"
              children={(field) => (
                <RolesSelector
                  defaultValue="USER"
                  options={["USER", "ADMIN"]}
                  onChange={(value) => field.handleChange(value)}
                />
              )}
            />
          </div>

          <form.Field
            name="password"
            children={(field) => {
              const fieldName = t(`common.form.${field.name}`);
              return (
                <div className="flex flex-col gap-3">
                  <Label htmlFor={field.name}>{fieldName}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="password"
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

          {createUserError && <ErrorElement error={createUserError} />}

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
  defaultValue,
  options,
  onChange,
}: {
  defaultValue: UserRole;
  options: UserRole[];
  onChange?: (value: UserRole) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="role">{t("common.form.role")}</Label>
      <Select onValueChange={(v) => onChange?.(v as UserRole)} defaultValue={defaultValue}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((r) => (
            <SelectItem key={r} value={r}>
              {t(`user.roles.${r}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

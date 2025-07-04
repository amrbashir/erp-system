import { CreateUserDto } from "@erp-system/sdk/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";

import type { AnyFieldApi } from "@tanstack/react-form";
import type z from "zod";

import type { UserRole } from "@/user";
import { apiClient } from "@/api-client";
import { FormErrors, FormFieldError } from "@/components/form-errors";
import { useOrg } from "@/hooks/use-org";

export function AddUserDialog() {
  const { slug: orgSlug } = useOrg();
  const { t } = useTranslation();
  const client = useQueryClient();

  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      role: "USER" as UserRole,
    } as z.infer<ReturnType<(typeof CreateUserDto)["strict"]>>,
    validators: {
      onSubmit: CreateUserDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const { username, password, role } = value;
      const { error } = await apiClient.post("/org/{orgSlug}/user/create", {
        params: { path: { orgSlug: orgSlug! } },
        body: { username, password, role },
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      client.invalidateQueries({ queryKey: ["users"] });
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
        <Button>{t("addUser")}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addUser")}</DialogTitle>
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
          <div className="flex w-full items-center gap-2">
            <form.Field
              name="username"
              children={(field) => <InputField className="w-full" field={field} />}
            />
            <form.Field
              name="role"
              children={(field) => (
                <SelectInput field={field} options={["USER", "ADMIN"] as UserRole[]} />
              )}
            />
          </div>

          <form.Field name="password" children={(field) => <InputField field={field} />} />

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

function InputField({
  field,
  className,
  ...props
}: React.ComponentProps<"div"> & { field: AnyFieldApi }) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <Label htmlFor={field.name}>{t(field.name as any)}</Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        type={field.name === "password" ? "password" : "text"}
        onChange={(e) => field.handleChange(e.target.value)}
        required
      />
      <FormFieldError field={field} />
    </div>
  );
}

function SelectInput({ field, options }: { field: AnyFieldApi; options: string[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={field.name}>{t(field.name as any)}</Label>

      <Select onValueChange={(e) => field.handleChange(e)} defaultValue={field.state.value}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

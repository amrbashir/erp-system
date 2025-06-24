import { apiClient } from "@/api-client";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/shadcn/components/ui/dialog";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { CreateUserDto } from "@tech-zone-store/sdk/zod";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FieldError } from "@/components/form-field-error";
import { Loader2Icon } from "lucide-react";
import { useParams } from "@tanstack/react-router";

export function AddUserDialog() {
  const { orgSlug } = useParams({ strict: false });
  const { t } = useTranslation();
  const client = useQueryClient();

  const [open, setOpen] = useState(false);

  const addUserMessage = useMemo(() => t("add") + " " + t("roles.USER"), [t]);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onSubmit: CreateUserDto,
    },
    onSubmit: async ({ value, formApi }) => {
      const { username, password } = value;
      const { error } = await apiClient.post("/org/{orgSlug}/user/create", {
        body: {
          username,
          password,
        },
        params: {
          path: { orgSlug: orgSlug! },
        },
      });

      if (error) {
        formApi.state.errorMap["onSubmit"] = error as any;
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
        <Button>{addUserMessage}</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{addUserMessage}</DialogTitle>
          <DialogDescription>{t("addUserDescription")}</DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-3">
            <form.Field
              name="username"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("username")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                  <FieldError field={field} />
                </>
              )}
            />
          </div>
          <div className="grid gap-3">
            <form.Field
              name="password"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("password")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="password"
                    required
                  />
                  <FieldError field={field} />
                </>
              )}
            />
          </div>

          {form.state.isFieldsValid && form.state.errorMap["onSubmit"] && (
            <p className="text-destructive text-sm">
              {t(`errors.${(form.state.errorMap["onSubmit"] as any).message}` as any)}
            </p>
          )}

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

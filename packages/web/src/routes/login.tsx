import { useAuth } from "@/auth";
import { Button } from "@/shadcn/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import i18n from "@/i18n";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shadcn/components/ui/separator";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { LoginUserDto } from "@tech-zone-store/sdk/zod";
import { Loader2Icon } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
  loader: () => ({ title: i18n.t("login"), hideUI: true }),
});

function Login() {
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onSubmit: LoginUserDto.omit({ organization: true }),
    },
    onSubmit: async ({ value }) => {
      const { username, password } = value;
      await auth.login(username, password);

      const search = router.state.location.search as { redirect?: string };
      router.history.push(search.redirect || "/");
    },
  });

  return (
    <div className="flex items-center justify-center w-screen h-screen gap-20">
      <img src="/logo.svg" alt="Logo" className="w-75 h-75" />

      <Separator orientation="vertical" className="h-50!" />

      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-10">
          <CardTitle>{t("login_to_account")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
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
                      />
                      <FieldInfo field={field} />
                    </>
                  )}
                />
              </div>
              <div className="grid gap-2">
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
                      />
                      <FieldInfo field={field} />
                    </>
                  )}
                />
              </div>
            </div>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {isSubmitting && <Loader2Icon className="animate-spin" />}
                  {t("login")}
                </Button>
              )}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldInfo({ field }: { field: AnyFieldApi }) {
  const { t } = useTranslation();

  const error = field.state.meta.errorMap["onSubmit"]?.[0];

  const fieldName = t(field.name as any);
  const message = t(`error.${error?.code}`, {
    field: fieldName,
    ...error,
  });

  return !field.state.meta.isValid && <span className="text-red-400">{message}</span>;
}

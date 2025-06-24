import { useAuth } from "@/auth/hook";
import { Button } from "@/shadcn/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import i18n from "@/i18n";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shadcn/components/ui/separator";
import { useForm, useStore } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";

export const Route = createFileRoute("/org/$orgSlug/login")({
  component: Login,
  context: () => ({ title: i18n.t("login"), hideUI: true }),
});

function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuth();

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const { username, password } = value;

      try {
        await login(username, password);
        const search = router.state.location.search as { redirect?: string };
        router.history.push(search.redirect || "/");
      } catch (error: any) {
        formApi.setErrorMap({ onSubmit: error.message });
      }
    },
  });

  type LoginForm = typeof form;

  function FormErrors({ form }: { form: LoginForm }) {
    const formErrorMap = useStore(form.store, (state) => state.errorMap);
    const onSubmitError = formErrorMap.onSubmit as any;

    if (!onSubmitError) return null;

    if (Array.isArray(onSubmitError)) {
      return (
        <p className="text-destructive text-sm">
          {onSubmitError.map((error, index) => (
            <div key={index}>{t(`errors.${error}` as any)}</div>
          ))}
        </p>
      );
    }

    return <p className="text-destructive text-sm">{t("errors.${onSubmitError}" as any)}</p>;
  }

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
                        required
                      />
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
                        required
                      />
                    </>
                  )}
                />
              </div>

              <FormErrors form={form} />
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

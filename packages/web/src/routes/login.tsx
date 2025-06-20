import { useAuth } from "@/auth";
import { Button } from "@/shadcn/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import i18n from "@/i18n";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shadcn/components/ui/separator";
import { useForm } from "@tanstack/react-form";
import { LoginUserDto } from "@tech-zone-store/sdk/zod";

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
      onChange: LoginUserDto,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
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
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {!field.state.meta.isValid && (
                        <em className="text-red-400">
                          {field.state.meta.errorMap["onChange"]?.[0].message}
                        </em>
                      )}
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
                        value={field.state.value as string}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="password"
                      />
                      {!field.state.meta.isValid && (
                        <em className="text-red-400">
                          {field.state.meta.errorMap["onChange"]?.[0].message}
                        </em>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              {t("login")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

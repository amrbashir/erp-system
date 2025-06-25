import { useAuth } from "@/auth/provider";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import i18n from "@/i18n";
import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Separator } from "@/shadcn/components/ui/separator";
import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { FormErrors } from "@/components/form-errors";
import { useOrg } from "@/components/org-provider";

export const Route = createFileRoute("/org/$orgSlug/login")({
  component: Login,
  context: () => ({ title: i18n.t("login"), hideUI: true }),
});

function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useAuth();

  const { slug: orgSlug } = useOrg();

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const { username, password } = value;

      try {
        await login(username, password, orgSlug);
        const search = router.state.location.search as { redirect?: string };
        router.history.push(search.redirect || "/org/" + orgSlug + "/");
      } catch (error: any) {
        formApi.setErrorMap({ onSubmit: error });
      }
    },
  });

  return (
    <div className="flex items-center justify-center w-screen h-screen gap-20">
      <div>
        <img src="/logo.svg" alt="ERP System Logo" width={300} className="mb-10" />
        <h1 className="text-2xl font-semibold text-center">{t("welcomeToErpOrg", { orgSlug })}</h1>
        <p className="text-lg text-center mt-2 text-gray-400">{t("welcomeToErpDescription")}</p>
      </div>

      <Separator orientation="vertical" className="h-50!" />

      <div className="flex-1 flex flex-col items-center w-full max-w-md gap-10">
        <Card className="w-full max-w-sm">
          <CardHeader className="flex flex-col items-center gap-10">
            <CardTitle>{t("login_to_account")}</CardTitle>
            <CardDescription>
              {t("login_to_account_description")}
              <span className="text-primary font-bold">{orgSlug}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              {Object.keys(form.options.defaultValues ?? []).map((fieldName) => (
                <div key={fieldName} className="flex flex-col gap-2">
                  <form.Field
                    name={fieldName as any}
                    children={(field) => (
                      <>
                        <Label htmlFor={field.name}>{t(field.name)}</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          type={field.name === "password" ? "password" : "text"}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required
                        />
                      </>
                    )}
                  />
                </div>
              ))}

              <FormErrors formState={form.state} />

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

        <Button variant="link" asChild>
          <Link to="/">{t("goBackHome")}</Link>
        </Button>
      </div>
    </div>
  );
}

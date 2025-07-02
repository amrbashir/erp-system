import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { Separator } from "@/shadcn/components/ui/separator";

import type { LoginUserDto } from "@erp-system/sdk/zod";
import type { z } from "zod";

import { Footer } from "@/components/footer";
import { FormErrors } from "@/components/form-errors";
import { Welcome } from "@/components/welcome";
import i18n from "@/i18n";
import { useAuth } from "@/providers/auth";

interface LoginSearch {
  redirect?: string;
  orgSlug?: string;
}

export const Route = createFileRoute("/login")({
  component: Login,
  context: () => ({ title: i18n.t("login"), hasSidebar: false }),
  validateSearch: ({ search }) => search as LoginSearch,
});

function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();

  const { orgSlug, redirect } = Route.useSearch();

  const form = useForm({
    defaultValues: {
      orgSlug: orgSlug || "",
      username: "",
      password: "",
    } as z.infer<ReturnType<(typeof LoginUserDto)["strict"]>> & { orgSlug: string },
    onSubmit: async ({ value, formApi }) => {
      const { username, password, orgSlug } = value;

      try {
        await login(username, password, orgSlug);
        navigate({ to: redirect || "/org/" + orgSlug + "/" });
      } catch (error: any) {
        formApi.setErrorMap({ onSubmit: error });
      }
    },
  });

  return (
    <>
      <main className="w-full *:p-5 *:md:p-20">
        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
          <Welcome orgSlug={orgSlug} />

          <Separator className="md:hidden" />
          <Separator orientation="vertical" className="hidden md:block md:h-75!" />

          <div className="flex flex-col items-center gap-10 w-full *:w-full md:w-auto *:md:w-auto md:min-w-sm *:md:min-w-sm">
            <Card>
              <CardHeader className="flex flex-col items-center gap-10">
                <CardTitle>{t("login_to_account")}</CardTitle>
                <CardDescription>
                  {t("login_to_account_description")}
                  <span className="text-primary font-bold">{orgSlug ?? t("yourorganization")}</span>
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
      </main>

      <Footer />
    </>
  );
}

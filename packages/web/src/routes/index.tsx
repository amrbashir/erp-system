import { CreateOrgDto, LoginUserDto } from "@erp-system/sdk/zod";
import { slugify } from "@erp-system/utils";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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

import type z from "zod";

import type { AuthUser } from "@/user";
import { apiClient } from "@/api-client";
import { FormErrors, FormFieldError } from "@/components/form-errors";
import { Welcome } from "@/components/welcome";
import { useAuth } from "@/providers/auth";

interface IndexSearch {
  redirect?: string;
  loginOrgSlug?: string;
}

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: ({ search }) => search as IndexSearch,
});

function Index() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <main className="w-full *:p-5 *:md:p-20">
        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
          <Welcome />

          <Separator className="md:hidden" />
          <Separator orientation="vertical" className="hidden md:block md:h-75!" />

          <div className="flex flex-col items-center gap-10 w-full *:w-full md:w-auto *:md:w-auto md:min-w-sm *:md:min-w-sm">
            {isAuthenticated && user ? <LoginExistingOrg user={user} /> : <LoginForm />}

            <div className="flex items-center">
              <Separator className="flex-2" />
              <p className="flex-1 text-center">{t("or")}</p>
              <Separator className="flex-2" />
            </div>

            <CreateNewOrganizationCard />
          </div>
        </div>
      </main>
    </>
  );
}

export function LoginExistingOrg({ user }: { user: AuthUser }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout: authLogout } = useAuth();

  const logout = useCallback(() => {
    authLogout(user.orgSlug);
    navigate({
      to: "/",
      search: { loginOrgSlug: user.orgSlug },
    });
  }, [authLogout, navigate]);

  const goToOrg = useCallback(() => {
    navigate({ to: "/org/" + user.orgSlug + "/" });
  }, [navigate]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-center gap-10">
        <CardTitle>{t("goToYourOrganization")}</CardTitle>
        <CardDescription>
          {t("goToYourOrganizationDescription2", {
            orgSlug: user.orgSlug ?? t("yourorganization"),
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={() => goToOrg()}>
          {t("go")}
        </Button>

        <Button variant="outline" className="w-full mt-4" onClick={() => logout()}>
          {t("logout")}
        </Button>
      </CardContent>
    </Card>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();

  const { loginOrgSlug: orgSlug, redirect } = Route.useSearch();

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
    <Card>
      <CardHeader className="flex flex-col items-center gap-10">
        <CardTitle>{t("loginToAccount")}</CardTitle>
        <CardDescription>
          {t("loginToAccountDescription")}
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
  );
}

function CreateNewOrganizationCard(props: React.ComponentProps<"div">) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuth();

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      username: "",
      password: "",
    } as z.infer<ReturnType<(typeof CreateOrgDto)["strict"]>>,
    validators: {
      onSubmit: CreateOrgDto,
      onChange: ({ value, formApi }) => {
        if (formApi.getFieldMeta("slug")?.isPristine) {
          const slug = slugify(value.name);
          formApi.setFieldValue("slug", slug, { dontUpdateMeta: true });
        }
      },
    },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await apiClient.post("/org/create", {
        body: value,
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      toast.success(t("organizationCreatedSuccessfully"));

      // If the user is authenticated, log them out before redirecting
      // to the new organization.
      if (isAuthenticated && user) logout(user.orgSlug);

      // Navigate to the new organization
      navigate({ to: "/", search: { loginOrgSlug: value.slug } });
    },
  });

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("createNewOrganization")}</CardTitle>
        <CardDescription>{t("createNewOrganizationDescription")}</CardDescription>
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
                    <Label htmlFor={field.name}>{t(`createOrg.${field.name}`)}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      type={field.name === "password" ? "password" : "text"}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FormFieldError field={field} />
                  </>
                )}
              ></form.Field>
            </div>
          ))}

          <FormErrors formState={form.state} />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                {t("create")}
              </Button>
            )}
          />
        </form>
      </CardContent>
    </Card>
  );
}

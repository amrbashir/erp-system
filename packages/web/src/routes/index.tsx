import { CreateOrgDto } from "@erp-system/server/dto";
import { slugify } from "@erp-system/utils/slug.ts";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card.tsx";
import { Input } from "@/shadcn/components/ui/input.tsx";
import { Label } from "@/shadcn/components/ui/label.tsx";
import { Separator } from "@/shadcn/components/ui/separator.tsx";

import type z from "zod";

import type { AuthUser } from "@/providers/auth.tsx";
import { FormErrors, FormFieldError } from "@/components/form-errors.tsx";
import { ButtonLink } from "@/components/ui/ButtonLink.tsx";
import { useAuth } from "@/providers/auth.tsx";
import { trpc } from "@/trpc.ts";

interface RouteSearch {
  redirect?: string;
  loginOrgSlug?: string;
  loginUsername?: string;
}

export const Route = createFileRoute("/")({
  component: RouteComponent,
  validateSearch: ({ search }) => search as RouteSearch,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const loginFormPasswordRef = React.useRef<HTMLInputElement>(null);

  return (
    <main className="w-full px-5 py-10 md:pt-[25%]">
      <div className="md:w-fit mx-auto flex flex-col items-center gap-10 *:w-full *:md:w-auto">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
          <Welcome />

          <Separator className="md:hidden" />
          <Separator orientation="vertical" className="hidden md:block md:h-75!" />

          {isAuthenticated && user ? (
            <LoginExistingOrg user={user} className="w-full md:w-auto md:min-w-sm *:md:min-w-sm" />
          ) : (
            <LoginForm
              loginFormPasswordRef={loginFormPasswordRef}
              className="w-full md:w-auto md:min-w-sm *:md:min-w-sm"
            />
          )}
        </div>

        <div className="md:self-end md:min-w-sm flex items-center">
          <Separator className="flex-2" />
          <p className="flex-1 text-center">{t("common.ui.or")}</p>
          <Separator className="flex-2" />
        </div>

        <CreateNewOrganizationCard
          className="md:self-end md:min-w-sm *:md:min-w-sm"
          loginFormPasswordRef={loginFormPasswordRef}
        />
      </div>
    </main>
  );
}

function Welcome(props: React.ComponentProps<"div">) {
  const { t } = useTranslation();

  return (
    <div {...props}>
      <img src="/logo.svg" alt="ERP System Logo" width={300} className="mb-10" />
      <h2 className="text-2xl font-semibold text-center">{t("welcomeToErp")}</h2>
      <p className="text-base text-center mt-2 text-secondary-foreground/60">
        {t("welcomeToErpDescription")}
      </p>
    </div>
  );
}

function LoginExistingOrg({
  user,
  ...props
}: React.ComponentProps<typeof Card> & { user: AuthUser }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout: authLogout } = useAuth();

  const logout = () => {
    authLogout();
    navigate({
      to: "/",
      search: { loginOrgSlug: user.orgSlug, loginUsername: user.username },
    });
  };

  return (
    <Card {...props}>
      <CardHeader className="flex flex-col items-center gap-10">
        <CardTitle>{t("org.goToYours")}</CardTitle>
        <CardDescription>
          {t("org.goToYoursDescription2", {
            orgSlug: user.orgSlug ?? t("org.yours"),
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ButtonLink className="w-full" to="/orgs/$orgSlug" params={{ orgSlug: user.orgSlug }}>
          {t("common.actions.go")}
        </ButtonLink>

        <Button variant="outline" className="w-full mt-4" onClick={() => logout()}>
          {t("common.actions.logout")}
        </Button>
      </CardContent>
    </Card>
  );
}

function LoginForm({
  loginFormPasswordRef,
  ...props
}: React.ComponentProps<typeof Card> & {
  loginFormPasswordRef: React.RefObject<HTMLInputElement | null>;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, loginIsError, loginError } = useAuth();

  const { loginOrgSlug: orgSlug, loginUsername: username, redirect } = Route.useSearch();

  const form = useForm({
    defaultValues: {
      orgSlug: orgSlug || "",
      username: username || "",
      password: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const { username, password, orgSlug } = value;
      await login(username, password, orgSlug);

      if (loginIsError) {
        formApi.setErrorMap({ onSubmit: loginError as any });
        return;
      }

      navigate({ to: redirect || "/orgs/$orgSlug", params: { orgSlug }, reloadDocument: true });
    },
  });

  return (
    <Card {...props}>
      <CardHeader className="flex flex-col items-center gap-10">
        <CardTitle>{t("auth.loginToAccount")}</CardTitle>
        <CardDescription>
          {t("auth.loginToAccountDescription")}
          <span className="text-primary font-bold">{orgSlug ?? t("org.yours")}</span>
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
          <div className="flex flex-col gap-2">
            <form.Field
              name="orgSlug"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t(`org.slug`)}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="username"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("common.form.username")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="password"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("common.form.password")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type="password"
                    ref={loginFormPasswordRef}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </>
              )}
            />
          </div>

          <form.Subscribe children={(state) => <FormErrors formState={state} />} />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button className="w-full" disabled={!canSubmit}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                {t("common.actions.login")}
              </Button>
            )}
          />
        </form>
      </CardContent>
    </Card>
  );
}

function CreateNewOrganizationCard({
  loginFormPasswordRef,
  ...props
}: React.ComponentProps<typeof Card> & {
  loginFormPasswordRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    mutateAsync: createOrg,
    isError: createOrgIsError,
    error: createOrgError,
  } = useMutation(trpc.orgs.create.mutationOptions());

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      username: "",
      password: "",
    } as z.infer<typeof CreateOrgDto>,
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
      await createOrg(value);

      if (createOrgIsError) {
        formApi.setErrorMap({ onSubmit: createOrgError as any });
        return;
      }

      toast.success(t("org.createdSuccessfully"));

      // Navigate to the new organization
      navigate({ to: "/", search: { loginOrgSlug: value.slug, loginUsername: value.username } });
      form.reset();
      loginFormPasswordRef.current?.focus();
    },
  });

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("org.createNew")}</CardTitle>
        <CardDescription>{t("org.createNewDescription")}</CardDescription>
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
          <div className="flex flex-col gap-2">
            <form.Field
              name="name"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("org.name")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FormFieldError field={field} />
                </>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="slug"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("org.slug")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FormFieldError field={field} />
                </>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="username"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("org.username")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FormFieldError field={field} />
                </>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="password"
              children={(field) => (
                <>
                  <Label htmlFor={field.name}>{t("org.password")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="password"
                  />
                  <FormFieldError field={field} />
                </>
              )}
            />
          </div>

          <form.Subscribe children={(state) => <FormErrors formState={state} />} />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button className="w-full" disabled={!canSubmit}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                {t("common.actions.create")}
              </Button>
            )}
          />
        </form>
      </CardContent>
    </Card>
  );
}

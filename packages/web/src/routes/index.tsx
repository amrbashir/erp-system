import { CreateOrgDto } from "@erp-system/server/org/org.dto.ts";
import { slugify } from "@erp-system/utils/slug.ts";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import z from "zod";
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

import { ErrorElement } from "@/components/error-element.tsx";
import { useAuth } from "@/providers/auth.tsx";
import { trpc } from "@/trpc.ts";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  const loginFormPasswordRef = React.useRef<HTMLInputElement>(null);

  return (
    <main className="w-full px-5 py-10 md:pt-[25%]">
      <div className="md:w-fit mx-auto flex flex-col items-center gap-10 *:w-full *:md:w-auto">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
          <Welcome />
          <Separator className="md:hidden" />
          <Separator orientation="vertical" className="hidden md:block md:h-75!" />
          <LoginForm
            loginFormPasswordRef={loginFormPasswordRef}
            className="w-full md:w-auto md:min-w-sm *:md:min-w-sm"
          />
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
    onSubmit: async ({ value }) => {
      const { username, password, orgSlug } = value;
      await login(username, password, orgSlug);

      if (loginIsError) return;

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

          {loginError && <ErrorElement error={loginError} />}

          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Button className="w-full" disabled={isSubmitting}>
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
    onSubmit: async ({ value }) => {
      await createOrg(value);

      if (createOrgIsError) return;

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
              children={(field) => {
                const fieldName = t("org.name");
                return (
                  <>
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
                  </>
                );
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="slug"
              children={(field) => {
                const fieldName = t("org.slug");
                return (
                  <>
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
                  </>
                );
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="username"
              children={(field) => {
                const fieldName = t("org.username");
                return (
                  <>
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
                  </>
                );
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <form.Field
              name="password"
              children={(field) => {
                const fieldName = t("org.password");

                return (
                  <>
                    <Label htmlFor={field.name}>{fieldName}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="password"
                    />
                    {field.state.meta.errors
                      .filter((e) => !!e)
                      .map((error, index) => (
                        <ErrorElement key={index} error={error} fieldName={fieldName} />
                      ))}
                  </>
                );
              }}
            />
          </div>

          {createOrgError && <ErrorElement error={createOrgError} />}

          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Button className="w-full" disabled={isSubmitting}>
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

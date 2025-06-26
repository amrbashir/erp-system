import { CreateOrgDto } from "@erp-system/sdk/zod";
import { slugify } from "@erp-system/utils";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
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

import { apiClient } from "@/api-client";
import { FormErrors, FormFieldError } from "@/components/form-errors";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { t } = useTranslation();

  return (
    <main className="h-screen w-screen flex items-center justify-center gap-20">
      <div className="flex flex-col items-center">
        <img src="/logo.svg" alt="ERP System Logo" width={300} className="mb-10" />
        <h1 className="text-3xl font-semibold text-center">{t("welcomeToErp")}</h1>
        <p className="text-lg text-center mt-2 text-gray-400">{t("welcomeToErpDescription")}</p>
      </div>

      <Separator orientation="vertical" className="h-50!" />

      <div className="flex flex-col items-center gap-10 min-w-sm">
        <GoToganizationCard className="w-full max-w-sm" />

        <div className="flex items-center gap-2">
          <Separator className="w-35!" />
          <p>{t("or")}</p>
          <Separator className="w-35!" />
        </div>

        <CreateNewOrganizationCard className="w-full max-w-sm" />
      </div>
    </main>
  );
}

function GoToganizationCard(props: React.ComponentProps<"div">) {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      orgSlug: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const { data: org, error } = await apiClient.get("/org/{orgSlug}", {
        params: { path: { orgSlug: value.orgSlug } },
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      if (!org) {
        formApi.setErrorMap({ onSubmit: "organizationNotFound" as any });
        return;
      }

      router.navigate({
        to: "/org/$orgSlug",
        params: { orgSlug: org.slug },
      });
    },
  });

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("goToYourOrganization")}</CardTitle>
        <CardDescription>{t("goToYourOrganizationDescription")}</CardDescription>
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
                  <Label htmlFor={field.name}>{t(field.name)}</Label>
                  <Input
                    id={field.name}
                    required
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </>
              )}
            ></form.Field>
          </div>

          <FormErrors formState={form.state} />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                {t("go")}
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
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: "",
      slug: "",
      username: "",
      password: "",
    },
    validators: {
      onSubmit: CreateOrgDto.required(),
      onChange: ({ formApi }) => {
        if (formApi.getFieldMeta("slug")?.isPristine) {
          const slug = slugify(formApi.getFieldValue("name"));
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

      router.navigate({
        to: "/org/$orgSlug",
        params: { orgSlug: value.slug },
      });
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

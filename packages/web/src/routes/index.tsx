import { apiClient } from "@/api-client";
import { FormErrors, FormFieldError } from "@/components/form-errors";
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
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CreateOrgDto } from "@erp-system/sdk/zod";
import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { slugify } from "@erp-system/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useTranslation();

  return (
    <div className="min-h-svh p-6 bg-black grid place-items-center">
      <div className="flex items-center justify-center w-full gap-20">
        <div className="flex flex-col items-center">
          <img src="/logo.svg" alt="ERP System Logo" width={300} className="mb-10" />
          <h1 className="text-3xl font-semibold text-center">{t("welcomeToErp")}</h1>
          <p className="text-lg text-center mt-2 text-gray-400">{t("welcomeToErpDescription")}</p>
        </div>

        <Separator orientation="vertical" className="h-50!" />

        <Card className="w-full max-w-sm">
          <GoToganizationCard />

          <div className="flex items-center">
            <Separator className="flex-1" />
            <p>{t("or")}</p>
            <Separator className="flex-1" />
          </div>

          <CreateNewOrganizationCard />
        </Card>
      </div>
    </div>
  );
}

function GoToganizationCard() {
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      slug: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const { slug } = value;
      const { data: exists, error } = await apiClient.post("/org/exists", {
        body: { slug },
      });

      if (error) {
        formApi.setErrorMap({ onSubmit: error });
        return;
      }

      if (!exists) {
        formApi.setErrorMap({ onSubmit: "organizationNotFound" as any });
        return;
      }

      router.navigate({
        to: "/org/$orgSlug",
        params: { orgSlug: slug },
      });
    },
  });

  return (
    <>
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
          {Object.keys(form.options.defaultValues ?? []).map((fieldName) => (
            <div key={fieldName} className="flex flex-col gap-2">
              <form.Field
                name={fieldName as any}
                children={(field) => (
                  <>
                    <Label htmlFor={field.name}>{t(`org.${field.name}`)}</Label>
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
          ))}

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
    </>
  );
}

function CreateNewOrganizationCard() {
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
    <>
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
    </>
  );
}

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
import { Footer } from "@/components/footer";
import { FormErrors, FormFieldError } from "@/components/form-errors";
import { Welcome } from "@/components/welcome";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { t } = useTranslation();

  return (
    <>
      <main className="w-full *:p-5 *:md:p-20">
        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
          <Welcome />

          <Separator className="md:hidden" />
          <Separator orientation="vertical" className="hidden md:block md:h-75!" />

          <div className="flex flex-col items-center gap-10 w-full *:w-full md:w-auto *:md:w-auto md:min-w-sm *:md:min-w-sm">
            <GoToganizationCard />

            <div className="flex items-center">
              <Separator className="flex-2" />
              <p className="flex-1 text-center">{t("or")}</p>
              <Separator className="flex-2" />
            </div>

            <CreateNewOrganizationCard />
          </div>
        </div>
      </main>

      <Footer />
    </>
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

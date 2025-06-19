import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import i18n from "@/i18n";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/login")({
  component: Login,
  loader: () => ({ title: i18n.t("login") }),
  context: (c) => ({ hideUI: true }),
});

function Login() {
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    await auth.login(username, password);

    const search = router.state.location.search as { redirect?: string };
    router.history.push(search.redirect || "/");
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen ">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-10">
          <img src="/favicon.svg" alt="Logo" className="w-16 h-16" />
          <CardTitle>{t("login_to_account")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={login} className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">{t("username")}</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("password")}</Label>
                </div>
                <Input id="password" name="password" type="password" required />
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

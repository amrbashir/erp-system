import { createFileRoute } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";
import i18n from "@/i18n";

export const Route = createFileRoute("/org/$orgSlug/")({
  component: Index,
  context: () => ({
    title: i18n.t("pages.home"),
    icon: HomeIcon,
  }),
});

function Index() {
  const { orgSlug } = Route.useParams();

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-svh p-6">
        <div className="text-6xl font-bold mb-4">🏠</div>
        <h1 className="text-3xl font-semibold text-center">
          Welcome to <span className="text-blue-400">{orgSlug}</span>
        </h1>
        <p className="text-lg text-center mt-2 text-gray-400">
          Your one-stop shop for all tech needs
        </p>
      </div>
    </div>
  );
}

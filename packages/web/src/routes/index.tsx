import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  context: () => ({ title: "Home", icon: Home, breadCrumb: "/" }),
});

function Index() {
  return <div>Welcome Home!</div>;
}

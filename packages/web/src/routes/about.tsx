import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  context: () => ({ title: "About", icon: Info }),
});

function About() {
  return <div>Hello from About!</div>;
}

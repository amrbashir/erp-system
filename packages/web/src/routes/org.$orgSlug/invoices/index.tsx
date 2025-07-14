import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$orgSlug/invoices/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/org/$orgSlug/invoices/sales", params });
  },
});

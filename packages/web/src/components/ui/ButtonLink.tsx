import { Link } from "@tanstack/react-router";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";

import type { LinkComponentProps } from "@tanstack/react-router";

export function ButtonLink({
  children,
  variant = "default",
  ...props
}: { variant?: React.ComponentProps<typeof Button>["variant"] } & LinkComponentProps) {
  return (
    <Button asChild variant={variant} className={cn(variant === "link" && "p-0 size-fit")}>
      <Link {...props}>{children}</Link>
    </Button>
  );
}

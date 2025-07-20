import { Link } from "@tanstack/react-router";
import { Button } from "@/shadcn/components/ui/button";

import type { LinkComponentProps } from "@tanstack/react-router";

export function ButtonLink({ children, ...props }: LinkComponentProps) {
  return (
    <Button asChild variant="link" className="p-0 size-fit">
      <Link {...props}>{children}</Link>
    </Button>
  );
}

import { createLink, Link } from "@tanstack/react-router";
import React from "react";
import { Button } from "@/shadcn/components/ui/button.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

import type { LinkComponent, LinkComponentProps } from "@tanstack/react-router";

interface BasicLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: LinkComponentProps<"a">["to"];
  variant?: React.ComponentProps<typeof Button>["variant"];
}

const ButtonLinkComponent = React.forwardRef<HTMLAnchorElement, BasicLinkProps>((props, ref) => {
  return (
    <Button
      asChild
      variant={props.variant}
      className={cn(props.variant === "link" && "p-0 size-fit")}
    >
      <Link to={props.to} ref={ref} {...props} />
    </Button>
  );
});

const CreatedButtonLinkComponent = createLink(ButtonLinkComponent);

export const ButtonLink: LinkComponent<typeof ButtonLinkComponent> = (props) => {
  return <CreatedButtonLinkComponent preload="intent" {...props} />;
};

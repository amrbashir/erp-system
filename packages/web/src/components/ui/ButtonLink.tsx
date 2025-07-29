import { createLink, Link } from "@tanstack/react-router";
import React from "react";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";

import type { LinkComponent } from "@tanstack/react-router";

export type BasicLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  React.ComponentProps<typeof Button>;

const ButtonLinkComponent = React.forwardRef<HTMLAnchorElement, BasicLinkProps>((props, ref) => {
  return (
    <Button
      asChild
      variant={props.variant}
      className={cn(props.variant === "link" && "p-0 size-fit")}
    >
      <Link ref={ref} {...props} />
    </Button>
  );
});

const CreatedButtonLinkComponent = createLink(ButtonLinkComponent);

export const ButtonLink: LinkComponent<typeof ButtonLinkComponent> = (props) => {
  return <CreatedButtonLinkComponent preload={"intent"} {...props} />;
};

import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/shadcn/components/ui/card.tsx";
import { cn } from "@/shadcn/lib/utils.ts";

import type { LinkComponentProps } from "@tanstack/react-router";

export type QuickActionLinkCardProps = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hoverBgColor: string;
  iconColor: string;
  iconBgColor: string;
  size?: "sm" | "default";
} & LinkComponentProps;

export function QuickActionLinkCard({
  title,
  icon: Icon,
  hoverBgColor,
  iconColor,
  iconBgColor,
  size = "default",
  to,
  params,
  ...props
}: QuickActionLinkCardProps) {
  return (
    <Link to={to} params={params} {...props}>
      <Card
        className={cn(
          "hover:shadow-md transition-shadow cursor-pointer md:items-center justify-center",
          size === "sm" ? "min-w-16 h-16 p-2" : "min-w-32 min-h-32 md:min-w-48 md:min-h-48",
          hoverBgColor,
        )}
      >
        <CardContent
          className={cn(
            "flex gap-4 items-center",
            size === "sm"
              ? "flex-row p-0 justify-center"
              : "flex-row md:flex-col md:justify-center",
          )}
        >
          <div
            className={cn(
              "rounded-full flex items-center justify-center relative",
              size === "sm" ? "p-2" : "size-20 p-5",
              iconBgColor,
              iconColor,
            )}
          >
            <Icon />
          </div>
          <p className={cn(size == "sm" ? "text-base md:text-lg" : "text-lg")}>{title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

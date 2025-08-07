import * as React from "react";
import { Button } from "@/shadcn/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/components/ui/popover.tsx";
import { useIsMobile } from "@/shadcn/hooks/use-mobile.ts";
import { cn } from "@/shadcn/lib/utils.ts";

import type { Input } from "@/shadcn/components/ui/input.tsx";
import { PhNumpadIcon } from "@/components/icons/PhNumpad.tsx";
import { InputNumber } from "@/components/ui/input-number.tsx";
import { Numpad } from "@/components/ui/numpad.tsx";

export function InputNumpad({
  variant = "default",
  value,
  onChange,
  className,
  ...props
}: {
  variant?: "default" | "ghost";
} & React.ComponentProps<typeof Input>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  return (
    <div className={cn("flex items-center", variant === "default" && "border rounded")}>
      <InputNumber
        variant={variant}
        ref={inputRef}
        value={value}
        onChange={onChange}
        className={cn("rounded-e-none", className)}
        {...props}
      />

      {isMobile && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              tabIndex={-1}
              variant="ghost"
              className={cn(
                "focus-visible:z-2 rounded-none",
                variant === "default" && "bg-input dark:bg-input/30 rounded-e",
              )}
            >
              <PhNumpadIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent asChild>
            <Numpad
              className="bg-card"
              value={value}
              onSubmit={(values) => {
                onChange?.({ target: values } as React.ChangeEvent<HTMLInputElement>);
                inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

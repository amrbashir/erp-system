import { useRef, useState } from "react";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/components/ui/popover";
import { cn } from "@/shadcn/lib/utils";

import { PhNumpadIcon } from "@/components/icons/PhNumpad";
import { InputNumber } from "@/components/ui/input-number";
import { Numpad } from "@/components/ui/numpad";
import { useMediaQuery } from "@/hooks/use-media-query";

export function InputNumpad({
  variant = "default",
  value,
  onChange,
  className,
  ...props
}: {
  variant?: "default" | "ghost";
} & React.ComponentProps<typeof Input>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

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

      {!isMobile ? (
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
                onChange?.({ target: values } as any);
                inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <></>
      )}
    </div>
  );
}

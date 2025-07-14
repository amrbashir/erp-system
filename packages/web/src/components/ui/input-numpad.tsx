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
  rounded = true,
  value,
  onChange,
  className,
  ...props
}: { rounded?: boolean } & React.ComponentProps<typeof Input>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className={cn("flex items-center border", rounded && "rounded")}>
      <InputNumber
        rounded={rounded}
        ref={inputRef}
        value={value}
        onChange={onChange}
        {...props}
        className={cn("rounded-e-none", className)}
      />

      {!isMobile ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              tabIndex={-1}
              variant="ghost"
              className={cn(
                "bg-input dark:bg-input/30 focus-visible:z-1 rounded-none",
                rounded && "rounded-e",
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

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
  value,
  onChange,
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="flex items-center border rounded">
      <InputNumber
        ref={inputRef}
        value={value}
        onChange={onChange}
        {...props}
        className={cn("rounded-e-none", className)}
      />

      {!isMobile ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="focus-visible:z-1 rounded-none rounded-e">
              <PhNumpadIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-card w-fit">
            <Numpad
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

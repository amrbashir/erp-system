import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useImperativeHandle, useRef } from "react";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";

export function InputNumber({
  variant = "default",
  className,
  ref,
  ...props
}: {
  variant?: "default" | "flat";
} & React.ComponentProps<typeof Input>) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const stepUp = () => {
    inputRef.current?.stepUp();
    inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const stepDown = () => {
    inputRef.current?.stepDown();
    inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return (
    <div className="flex-1 flex items-center" tabIndex={-1}>
      <div className="flex flex-col h-9!">
        <Button
          tabIndex={-1}
          type="button"
          variant="secondary"
          className={cn(
            "focus-visible:z-1 p-2! h-4.5! rounded-none",
            variant === "default" && "rounded-ss",
          )}
          size="sm"
          onClick={() => stepUp()}
        >
          <ChevronUpIcon />
        </Button>
        <Button
          tabIndex={-1}
          type="button"
          variant="secondary"
          className={cn(
            "focus-visible:z-1 p-2! h-4.5! rounded-none",
            variant === "default" && "rounded-es",
          )}
          size="sm"
          onClick={() => stepDown()}
        >
          <ChevronDownIcon />
        </Button>
      </div>

      <Input
        ref={inputRef}
        type="number"
        lang="en-US"
        className={cn(
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "focus-visible:z-1 border-none rounded-none flex-1",
          variant === "default" && "rounded-es",
          variant === "flat" && "bg-transparent! shadow-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}

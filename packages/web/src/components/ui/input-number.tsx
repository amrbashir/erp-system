import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useImperativeHandle, useRef } from "react";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";

export function InputNumber({ className, ref, ...props }: React.ComponentProps<typeof Input>) {
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
    <div className="flex-1 flex items-center">
      <div className="flex flex-col h-9!">
        <Button
          type="button"
          variant="secondary"
          className="focus-visible:z-1 rounded-none rounded-ss p-2! h-4.5!"
          size="sm"
          onClick={stepUp}
        >
          <ChevronUpIcon />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="focus-visible:z-1 rounded-none rounded-es p-2! h-4.5!"
          size="sm"
          onClick={stepDown}
        >
          <ChevronDownIcon />
        </Button>
      </div>

      <Input
        ref={inputRef}
        type="number"
        className={cn(
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "focus-visible:z-1 border-none rounded-none rounded-e",
          className,
        )}
        {...props}
      />
    </div>
  );
}

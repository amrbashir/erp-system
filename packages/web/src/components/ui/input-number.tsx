import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { set } from "zod";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";

export function InputNumber({
  rounded = true,
  className,
  ref,
  ...props
}: {
  rounded?: boolean;
} & React.ComponentProps<typeof Input>) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const [shitPressed, setShitPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShitPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShitPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

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
          className={cn("focus-visible:z-1 p-2! h-4.5! rounded-none", rounded && "rounded-ss")}
          size="sm"
          onClick={() => stepUp()}
        >
          <ChevronUpIcon />
        </Button>
        <Button
          tabIndex={-1}
          type="button"
          variant="secondary"
          className={cn("focus-visible:z-1 p-2! h-4.5! rounded-none", rounded && "rounded-es")}
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
          rounded && "rounded-es",
          !rounded && "bg-transparent! shadow-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}

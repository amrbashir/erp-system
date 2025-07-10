import { CheckIcon, DeleteIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { set } from "zod";
import { Button } from "@/shadcn/components/ui/button";
import { Input } from "@/shadcn/components/ui/input";
import { cn } from "@/shadcn/lib/utils";

// prettier-ignore
const KEYS = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  "Del", "0", "."
] as const;

type OnSubmit = (values: {
  value: string | number | readonly string[] | undefined;
  valueAsNumber: number;
}) => void;

export function Numpad({
  value: outerValue,
  className,
  onSubmit,
  ...props
}: {
  value: string | number | readonly string[] | undefined;
  onSubmit?: OnSubmit;
  min?: number;
  max?: number;
} & React.ComponentProps<"div">) {
  const [value, setValue] = useState(outerValue ?? "0");
  const [valueAsNumber, setValueAsNumber] = useState(parseFloat(value.toString()));

  const inputRef = useRef<HTMLInputElement>(null);

  const handleKey = useCallback(
    (key: string) => {
      let currentVal = value.toString();
      let newValue;
      let [start, end] = [
        inputRef.current?.selectionStart ?? 0,
        inputRef.current?.selectionEnd ?? 0,
      ];

      if (key === "Del") {
        if (start === end) {
          // No selection, delete one character before cursor
          newValue = currentVal.slice(0, Math.max(0, start - 1)) + currentVal.slice(start);
        } else {
          // Delete selected text
          newValue = currentVal.slice(0, start) + currentVal.slice(end);
        }
        // If deleting everything, reset to "0"
        if (newValue === "") newValue = "0";
      } else if (key === "." && currentVal.toString().includes(".")) {
        // Prevent adding multiple decimal points
        return;
      } else {
        if (currentVal === "0" && key !== ".") {
          // Replace the initial "0" with the new digit
          newValue = key;
        } else if (start === end) {
          // No selection, insert at cursor position
          newValue = currentVal.slice(0, start) + key + currentVal.slice(start);
        } else {
          newValue = currentVal.slice(0, start) + key + currentVal.slice(end);
        }
      }

      if (newValue) {
        setValue(newValue);
        setValueAsNumber(parseFloat(newValue));
      }
    },
    [value],
  );

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setValueAsNumber(parseFloat(e.target.value));
          }}
        />
        <Button
          variant="ghost"
          className="text-green-300 hover:text-green-300"
          onClick={() => onSubmit?.({ value, valueAsNumber })}
        >
          <CheckIcon />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2" dir="ltr">
        {KEYS.map((key) => (
          <Button
            className={cn("p-10!", key === "Del" && "text-red-300 hover:text-red-300")}
            variant={key === "Del" || key === "." ? "ghost" : "secondary"}
            key={key}
            onClick={() => handleKey(key)}
          >
            {key === "Del" ? <DeleteIcon /> : <span>{key}</span>}
          </Button>
        ))}
      </div>
    </div>
  );
}

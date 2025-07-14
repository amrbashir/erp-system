import { InputNumpad } from "@/components/ui/input-numpad";

export function InputNumpadFlat({ className, ...props }: React.ComponentProps<typeof InputNumpad>) {
  return <InputNumpad rounded={false} {...props} />;
}

import * as React from "react";

export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  deps: React.DependencyList = [],
): void {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key) return;
      event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, handler, ...deps]);
}

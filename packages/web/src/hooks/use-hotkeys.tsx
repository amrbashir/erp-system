import { useEffect } from "react";

import type { DependencyList } from "react";

export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  deps: DependencyList = [],
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key) return;
      event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, handler, ...deps]);
}

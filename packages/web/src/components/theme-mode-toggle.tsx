import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export function ThemeModeToggle() {
  const { setTheme, theme } = useTheme();

  const modes = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ModeIcon = modes[theme];

  const nextTheme = useMemo(
    () => (theme === "light" ? "dark" : theme === "dark" ? "system" : "light"),
    [theme],
  );

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <ModeIcon />
    </Button>
  );
}

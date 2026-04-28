import { Moon, Sun, Monitor } from "@phosphor-icons/react";
import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useTheme, type Theme } from "@workspace/ui/hooks/use-theme";

const order: Theme[] = ["light", "dark", "system"];
const icons: Record<Theme, React.ReactNode> = {
	light: <Sun data-icon="inline-start" />,
	dark: <Moon data-icon="inline-start" />,
	system: <Monitor data-icon="inline-start" />,
};

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	function handleSwitch() {
		const next = order[(order.indexOf(theme) + 1) % order.length];
		setTheme(next);
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleSwitch}
			aria-label={m.theme_switcher_label()}
			title={m.theme_switcher_label()}
		>
			{icons[theme]}
		</Button>
	);
}

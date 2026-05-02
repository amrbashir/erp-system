import { MoonIcon, SunIcon, MonitorIcon } from "@phosphor-icons/react";
import { m } from "@workspace/i18n";

import { Button } from "./button";
import { useTheme, type Theme } from "./theme-provider";

const order: Theme[] = ["light", "dark", "system"];
const icons: Record<Theme, React.ReactNode> = {
	light: <SunIcon data-icon="inline-start" />,
	dark: <MoonIcon data-icon="inline-start" />,
	system: <MonitorIcon data-icon="inline-start" />,
};

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();
	const label = m.theme_switcher_label();

	function handleSwitch() {
		setTheme(order[(order.indexOf(theme) + 1) % order.length]);
	}

	return (
		<Button variant="ghost" size="sm" onClick={handleSwitch} aria-label={label} title={label}>
			{icons[theme]}
		</Button>
	);
}

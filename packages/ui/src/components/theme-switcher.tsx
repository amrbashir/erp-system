import { Moon, Sun, Monitor } from "@phosphor-icons/react";

import { Button } from "./button";
import { useTheme, type Theme } from "./theme-provider";

const order: Theme[] = ["light", "dark", "system"];
const icons: Record<Theme, React.ReactNode> = {
	light: <Sun data-icon="inline-start" />,
	dark: <Moon data-icon="inline-start" />,
	system: <Monitor data-icon="inline-start" />,
};

/**
 * Cycles light → dark → system. Label is passed in so this component stays
 * i18n-agnostic; consumer apps localize at the call site.
 */
export function ThemeSwitcher({ label }: { label: string }) {
	const { theme, setTheme } = useTheme();

	function handleSwitch() {
		setTheme(order[(order.indexOf(theme) + 1) % order.length]);
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleSwitch}
			aria-label={label}
			title={label}
		>
			{icons[theme]}
		</Button>
	);
}

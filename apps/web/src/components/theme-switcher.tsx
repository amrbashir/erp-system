import { m } from "@workspace/i18n";
import { ThemeSwitcher as BaseThemeSwitcher } from "@workspace/ui/components/theme-switcher";

export function ThemeSwitcher() {
	return <BaseThemeSwitcher label={m.theme_switcher_label()} />;
}

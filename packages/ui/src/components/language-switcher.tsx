import { GlobeSimpleIcon } from "@phosphor-icons/react";
import { getLocale, getNextLocale, locales, m, setLocale } from "@workspace/i18n";

import { Button } from "./button";

export function LanguageSwitcher() {
	const current = getLocale();

	function handleSwitch() {
		void setLocale(getNextLocale(current, locales));
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleSwitch}
			aria-label={m.language_switcher_label()}
			title={m.language_switcher_label()}
		>
			<GlobeSimpleIcon data-icon="inline-start" />
			{m.language_endonym()}
		</Button>
	);
}

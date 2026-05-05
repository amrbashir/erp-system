import { CheckIcon, GlobeSimpleIcon } from "@phosphor-icons/react";
import { getLocale, locales, m, setLocale } from "@workspace/i18n";

import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";

type Locale = (typeof locales)[number];

function endonym(locale: Locale) {
	return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
}

export function LanguageSwitcher() {
	const current = getLocale();
	const label = m.language_switcher_label();

	function handleSelect(locale: Locale) {
		if (locale !== current) void setLocale(locale);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="sm" aria-label={label} title={label}>
						<GlobeSimpleIcon data-icon="inline-start" />
						{endonym(current)}
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="min-w-32">
				{locales.map((locale) => (
					<DropdownMenuItem key={locale} onClick={() => handleSelect(locale)}>
						<span className="flex-1">{endonym(locale)}</span>
						{locale === current && <CheckIcon className="ms-1" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

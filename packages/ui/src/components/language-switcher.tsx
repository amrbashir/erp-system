import { GlobeSimpleIcon } from "@phosphor-icons/react";
import { getLocale, locales, m, setLocale } from "@workspace/i18n";
import { useEffect, useRef, useState } from "react";

import { Button } from "./button";

type Locale = (typeof locales)[number];

function endonym(locale: Locale) {
	return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
}

export function LanguageSwitcher() {
	const current = getLocale();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const label = m.language_switcher_label();

	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	function handleSelect(locale: Locale) {
		setOpen(false);
		if (locale !== current) void setLocale(locale);
	}

	return (
		<div className="relative" ref={ref}>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setOpen(!open)}
				aria-label={label}
				title={label}
				aria-expanded={open}
			>
				<GlobeSimpleIcon data-icon="inline-start" />
				{endonym(current)}
			</Button>

			{open && (
				<div className="border-border bg-background absolute end-0 top-full z-50 mt-1 min-w-32 rounded border shadow-md">
					{locales.map((locale) => (
						<button
							key={locale}
							type="button"
							onClick={() => handleSelect(locale)}
							className={`hover:bg-muted w-full px-3 py-2 text-start text-sm ${
								locale === current ? "bg-muted" : ""
							}`}
						>
							{endonym(locale)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

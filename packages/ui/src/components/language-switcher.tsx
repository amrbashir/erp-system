import { Translate } from "@phosphor-icons/react";
import { Button } from "./button";

interface LanguageSwitcherProps {
	label: string;
	onSwitch: () => void;
}

function LanguageSwitcher({ label, onSwitch }: LanguageSwitcherProps) {
	return (
		<Button variant="ghost" size="sm" onClick={onSwitch}>
			<Translate data-icon="inline-start" />
			{label}
		</Button>
	);
}

export { LanguageSwitcher };
export type { LanguageSwitcherProps };

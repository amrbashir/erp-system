import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";
import logoSvg from "./logo.svg?raw";
import logoWordmarkSvg from "./logo-wordmark.svg?raw";
import wordmarkSvg from "./wordmark.svg?raw";

type Props = Omit<ComponentProps<"span">, "dangerouslySetInnerHTML" | "children">;

function SvgSpan({ html, className, ...props }: Props & { html: string }) {
	return (
		<span
			className={cn("inline-block dark:invert [&>svg]:h-full [&>svg]:w-auto", className)}
			dangerouslySetInnerHTML={{ __html: html }}
			{...props}
		/>
	);
}

export function Logo(props: Props) {
	return <SvgSpan html={logoSvg} {...props} />;
}

export function Wordmark(props: Props) {
	return <SvgSpan html={wordmarkSvg} {...props} />;
}

export function LogoWordmark(props: Props) {
	return <SvgSpan html={logoWordmarkSvg} {...props} />;
}

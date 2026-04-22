import { m } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";

import { checkActivationApi, writeCachedToken } from "@/lib/activation";

export function ActivationScreen({
	hardwareId,
	onActivated,
}: {
	hardwareId: string;
	onActivated: () => void;
}) {
	const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(hardwareId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	async function handleCheck() {
		setStatus("checking");
		setError("");

		try {
			const result = await checkActivationApi(hardwareId);
			if ("token" in result) {
				await writeCachedToken(result.token);
				onActivated();
			} else {
				setStatus("error");
				if (result.status === "pending") {
					setError(m.activation_pending());
				} else if (result.status === "revoked") {
					setError(m.activation_revoked());
				} else if (result.status === "unknown") {
					setError(m.activation_unknown());
				} else {
					setError(result.error);
				}
			}
		} catch {
			setStatus("error");
			setError(m.activation_network_error());
		}
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
				<h1 className="text-lg font-medium">{m.activation_heading()}</h1>
				<p className="text-muted-foreground text-sm">{m.activation_description()}</p>

				<div className="w-full">
					<label className="text-muted-foreground mb-1 block text-xs">
						{m.activation_hardware_id()}
					</label>
					<div className="flex items-center gap-2">
						<code className="bg-muted flex-1 truncate rounded-none border px-3 py-2 font-mono text-xs select-all">
							{hardwareId}
						</code>
						<Button variant="outline" size="sm" onClick={handleCopy}>
							{copied ? m.activation_copied() : m.activation_copy()}
						</Button>
					</div>
				</div>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<Button onClick={handleCheck} disabled={status === "checking"} className="w-full">
					{status === "checking" ? m.activation_checking() : m.activation_check()}
				</Button>

				<p className="text-muted-foreground text-xs">{m.activation_waiting()}</p>
			</div>
		</div>
	);
}

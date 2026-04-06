import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
	checkActivationApi,
	writeCachedToken,
} from "../lib/activation";

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
					setError("Activation pending. Contact your administrator.");
				} else if (result.status === "revoked") {
					setError("Activation revoked. Contact your administrator.");
				} else if (result.status === "unknown") {
					setError("Hardware ID not registered. Contact your administrator.");
				} else {
					setError(result.error);
				}
			}
		} catch {
			setStatus("error");
			setError("Could not reach activation server. Check your internet connection.");
		}
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
				<h1 className="text-lg font-medium">Desktop Activation</h1>
				<p className="text-muted-foreground text-sm">
					Share this hardware ID with your administrator to activate this device.
				</p>

				<div className="w-full">
					<label className="text-muted-foreground mb-1 block text-xs">
						Hardware ID
					</label>
					<div className="flex items-center gap-2">
						<code className="bg-muted flex-1 truncate rounded-none border px-3 py-2 text-xs font-mono select-all">
							{hardwareId}
						</code>
						<Button variant="outline" size="sm" onClick={handleCopy}>
							{copied ? "Copied" : "Copy"}
						</Button>
					</div>
				</div>

				{error && (
					<p className="text-destructive text-sm">{error}</p>
				)}

				<Button
					onClick={handleCheck}
					disabled={status === "checking"}
					className="w-full"
				>
					{status === "checking" ? "Checking…" : "Check activation"}
				</Button>

				<p className="text-muted-foreground text-xs">
					Waiting for activation…
				</p>
			</div>
		</div>
	);
}

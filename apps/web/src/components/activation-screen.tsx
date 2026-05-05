import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { m } from "@workspace/i18n";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@workspace/ui/components/input-group";
import { useState } from "react";

import { checkActivationApi, writeCachedToken } from "@/lib/activation";
import { ActivationMisconfiguredError } from "@/lib/errors";

export function ActivationScreen({
	hardwareId,
	onActivated,
}: {
	hardwareId: string;
	onActivated: () => void;
}) {
	const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
	const [error, setError] = useState("");
	const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");

	async function handleCopy() {
		const r = await navigator.clipboard.writeText(hardwareId).catch((e: Error) => e);
		setCopyState(r instanceof Error ? "error" : "success");
		setTimeout(() => setCopyState("idle"), 2000);
	}

	async function handleCheck() {
		setStatus("checking");
		setError("");

		const result = await checkActivationApi(hardwareId);
		if (result instanceof Error) {
			setStatus("error");
			if (result instanceof ActivationMisconfiguredError) setError(result.message);
			else setError(m.activation_network_error());
			return;
		}

		if ("token" in result) {
			const writeRes = await writeCachedToken(result.token).catch((e: Error) => e);
			if (writeRes instanceof Error) {
				setStatus("error");
				setError(writeRes.message);
				return;
			}
			onActivated();
			return;
		}

		setStatus("error");
		if (result.status === "pending") setError(m.activation_pending());
		else if (result.status === "revoked") setError(m.activation_revoked());
		else setError(m.activation_unknown());
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-6">
			<div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
				<h1 className="text-lg font-medium">{m.activation_heading()}</h1>
				<p className="text-muted-foreground text-sm">{m.activation_description()}</p>

				<Field className="w-full">
					<FieldLabel className="text-muted-foreground">
						{m.activation_hardware_id()}
					</FieldLabel>
					<InputGroup>
						<InputGroupInput
							readOnly
							value={hardwareId}
							className="font-mono select-all"
						/>
						<InputGroupAddon align="inline-end">
							<InputGroupButton size="sm" onClick={handleCopy}>
								{copyState === "success" ? (
									<CheckIcon />
								) : copyState === "error" ? (
									<XIcon />
								) : (
									m.activation_copy()
								)}
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</Field>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<Button onClick={handleCheck} disabled={status === "checking"} className="w-full">
					{status === "checking" ? m.activation_checking() : m.activation_check()}
				</Button>

				<p className="text-muted-foreground text-xs">{m.activation_waiting()}</p>
			</div>
		</div>
	);
}

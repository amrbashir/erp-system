import { useUpdater } from "@/hooks/use-updater";
import { Button } from "@workspace/ui/components/button";

export function UpdatePrompt() {
	const { status, install, dismiss } = useUpdater();

	if (status.kind === "idle" || status.kind === "checking") {
		return null;
	}

	if (status.kind === "error") {
		return (
			<div
				role="alert"
				className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-destructive/10 px-4 py-3 text-sm shadow-lg"
			>
				<span>Update failed: {status.message}</span>
				<Button variant="ghost" size="sm" onClick={dismiss}>
					Dismiss
				</Button>
			</div>
		);
	}

	if (status.kind === "ready") {
		return (
			<div
				role="status"
				className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg"
			>
				<span>Update installed. Restart to apply.</span>
			</div>
		);
	}

	if (status.kind === "downloading") {
		return (
			<div
				role="status"
				className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg"
			>
				<span>Downloading update... {status.progress}%</span>
			</div>
		);
	}

	return (
		<div
			role="dialog"
			aria-label="Update available"
			className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg"
		>
			<span>A new version is available ({status.update.version})</span>
			<Button size="sm" onClick={install}>
				Update
			</Button>
			<Button variant="ghost" size="sm" onClick={dismiss}>
				Later
			</Button>
		</div>
	);
}

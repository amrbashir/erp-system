import { useCallback, useEffect, useState } from "react";
import {
	type UpdateStatus,
	checkForUpdate,
	downloadAndInstall,
	isTauri,
} from "@/lib/updater";

export function useUpdater() {
	const [status, setStatus] = useState<UpdateStatus>({ kind: "idle" });

	useEffect(() => {
		if (!isTauri()) return;

		setStatus({ kind: "checking" });
		checkForUpdate()
			.then((update) => {
				if (update) {
					setStatus({ kind: "available", update });
				} else {
					setStatus({ kind: "idle" });
				}
			})
			.catch((err) => {
				setStatus({ kind: "error", message: String(err) });
			});
	}, []);

	const install = useCallback(async () => {
		if (status.kind !== "available") return;
		const { update } = status;

		try {
			setStatus({ kind: "downloading", progress: 0 });
			await downloadAndInstall(update, (progress) => {
				setStatus({ kind: "downloading", progress });
			});
			setStatus({ kind: "ready" });
		} catch (err) {
			setStatus({ kind: "error", message: String(err) });
		}
	}, [status]);

	const dismiss = useCallback(() => {
		setStatus({ kind: "idle" });
	}, []);

	return { status, install, dismiss };
}

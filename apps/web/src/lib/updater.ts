import type { Update } from "@tauri-apps/plugin-updater";

export type UpdateStatus =
	| { kind: "idle" }
	| { kind: "checking" }
	| { kind: "available"; update: Update }
	| { kind: "downloading"; progress: number }
	| { kind: "ready" }
	| { kind: "error"; message: string };

export async function checkForUpdate(): Promise<Update | null> {
	const { check } = await import("@tauri-apps/plugin-updater");
	return await check();
}

export async function downloadAndInstall(
	update: Update,
	onProgress: (progress: number) => void,
): Promise<void> {
	let totalLength = 0;
	let downloaded = 0;

	await update.downloadAndInstall((event) => {
		if (event.event === "Started" && event.data.contentLength) {
			totalLength = event.data.contentLength;
		} else if (event.event === "Progress") {
			downloaded += event.data.chunkLength;
			if (totalLength > 0) {
				onProgress(Math.round((downloaded / totalLength) * 100));
			}
		}
	});
}

export function isTauri(): boolean {
	return "__TAURI_INTERNALS__" in window;
}

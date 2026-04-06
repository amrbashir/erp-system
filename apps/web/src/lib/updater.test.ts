import { describe, expect, it, vi } from "vitest";
import { type UpdateStatus, downloadAndInstall, isTauri } from "./updater";

describe("isTauri", () => {
	it("returns false when __TAURI_INTERNALS__ is not on window", () => {
		expect(isTauri()).toBe(false);
	});

	it("returns true when __TAURI_INTERNALS__ is on window", () => {
		// @ts-expect-error -- injecting test global
		window.__TAURI_INTERNALS__ = {};
		try {
			expect(isTauri()).toBe(true);
		} finally {
			// @ts-expect-error -- cleanup
			delete window.__TAURI_INTERNALS__;
		}
	});
});

describe("downloadAndInstall", () => {
	it("reports progress via callback", async () => {
		const progressValues: number[] = [];

		const fakeUpdate = {
			downloadAndInstall: vi.fn(
				async (cb: (event: { event: string; data: Record<string, number> }) => void) => {
					cb({ event: "Started", data: { contentLength: 100 } });
					cb({ event: "Progress", data: { chunkLength: 30 } });
					cb({ event: "Progress", data: { chunkLength: 70 } });
					cb({ event: "Finished", data: {} });
				},
			),
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await downloadAndInstall(fakeUpdate as any, (p) => progressValues.push(p));

		expect(fakeUpdate.downloadAndInstall).toHaveBeenCalledOnce();
		expect(progressValues).toEqual([30, 100]);
	});

	it("does not report progress when contentLength is unknown", async () => {
		const progressValues: number[] = [];

		const fakeUpdate = {
			downloadAndInstall: vi.fn(
				async (cb: (event: { event: string; data: Record<string, number> }) => void) => {
					cb({ event: "Started", data: {} });
					cb({ event: "Progress", data: { chunkLength: 50 } });
				},
			),
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await downloadAndInstall(fakeUpdate as any, (p) => progressValues.push(p));

		expect(progressValues).toEqual([]);
	});
});

describe("UpdateStatus type", () => {
	it("can represent all status kinds", () => {
		const statuses: UpdateStatus[] = [
			{ kind: "idle" },
			{ kind: "checking" },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{ kind: "available", update: {} as any },
			{ kind: "downloading", progress: 50 },
			{ kind: "ready" },
			{ kind: "error", message: "failed" },
		];
		expect(statuses).toHaveLength(6);
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectLocale, persistLocale } from "./locale";

function createLocalStorageMock() {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value);
		},
		removeItem: (key: string) => {
			store.delete(key);
		},
		clear: () => store.clear(),
		get length() {
			return store.size;
		},
		key: (_index: number) => null as string | null,
	};
}

describe("detectLocale", () => {
	let storage: ReturnType<typeof createLocalStorageMock>;

	beforeEach(() => {
		storage = createLocalStorageMock();
		vi.stubGlobal("localStorage", storage);
		vi.stubGlobal("navigator", { languages: ["en-US"], language: "en-US" });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns persisted locale from localStorage", () => {
		storage.setItem("locale", "ar");
		expect(detectLocale()).toBe("ar");
	});

	it("ignores invalid persisted locale", () => {
		storage.setItem("locale", "fr");
		expect(detectLocale()).toBe("en");
	});

	it("detects Arabic from browser locale", () => {
		vi.stubGlobal("navigator", { languages: ["ar-SA", "en-US"], language: "ar-SA" });
		expect(detectLocale()).toBe("ar");
	});

	it("detects English from browser locale", () => {
		vi.stubGlobal("navigator", { languages: ["en-US"], language: "en-US" });
		expect(detectLocale()).toBe("en");
	});

	it("defaults to en for unsupported browser locale", () => {
		vi.stubGlobal("navigator", { languages: ["fr-FR"], language: "fr-FR" });
		expect(detectLocale()).toBe("en");
	});

	it("localStorage takes precedence over browser locale", () => {
		storage.setItem("locale", "ar");
		vi.stubGlobal("navigator", { languages: ["en-US"], language: "en-US" });
		expect(detectLocale()).toBe("ar");
	});

	it("falls back to navigator.language when languages is empty", () => {
		vi.stubGlobal("navigator", { languages: [], language: "ar" });
		expect(detectLocale()).toBe("ar");
	});
});

describe("persistLocale", () => {
	let storage: ReturnType<typeof createLocalStorageMock>;

	beforeEach(() => {
		storage = createLocalStorageMock();
		vi.stubGlobal("localStorage", storage);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("saves locale to localStorage", () => {
		persistLocale("ar");
		expect(storage.getItem("locale")).toBe("ar");
	});

	it("overwrites previous locale", () => {
		persistLocale("ar");
		persistLocale("en");
		expect(storage.getItem("locale")).toBe("en");
	});
});

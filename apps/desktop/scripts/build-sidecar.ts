import { execSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const serverDir = resolve(root, "packages/server");
const binDir = resolve(import.meta.dirname, "../src-tauri/binaries");

function buildNitro() {
	// Clean .output first so deleted routes/files don't linger in the bundled
	// sidecar. Nitro overwrites in place but never prunes stale artifacts.
	rmSync(resolve(serverDir, ".output"), { recursive: true, force: true });
	execSync("pnpm run build:desktop", { cwd: serverDir, stdio: "inherit" });
}

function patchNodeImports() {
	const PROBLEMATIC_FILES = ["_libs/electric-sql__pglite.mjs"];
	const NODE_BUILTINS = new Set(builtinModules.filter((m) => !m.startsWith("_")));

	const importPattern = new RegExp(
		`(from\\s+["'])(?!node:)(${[...NODE_BUILTINS].join("|")})(["'])`,
		"g",
	);

	const outputDir = resolve(serverDir, ".output/server");
	for (const file of PROBLEMATIC_FILES) {
		const full = resolve(outputDir, file);
		const content = readFileSync(full, "utf-8");
		const fixed = content.replace(importPattern, "$1node:$2$3");
		if (fixed !== content) {
			writeFileSync(full, fixed);
			console.log(`✔ Patched bare node imports in ${full}`);
		}
	}
}

function denoCompile() {
	const targetTriple = execSync("rustc -vV", { encoding: "utf-8" })
		.match(/host: (.+)/)?.[1]
		.trim();

	const entry = resolve(serverDir, ".output/server/index.mjs");
	const outPath = resolve(binDir, `erp-sidecar-${targetTriple}`);

	// Explicit permission set instead of --allow-all. Drops --allow-run
	// (sidecar must never spawn subprocesses) and --allow-import (everything
	// is bundled at compile time). The remaining grants stay broad because
	// PGlite/Nitro/better-auth read many env/path/sys APIs we can't fully
	// enumerate without runtime testing.
	const perms = [
		"--allow-env",
		"--allow-net",
		"--allow-read",
		"--allow-write",
		"--allow-sys",
		"--allow-ffi",
	].join(" ");

	execSync(`deno compile --no-check ${perms} --output "${outPath}" "${entry}"`, {
		stdio: "inherit",
	});

	console.log(`Sidecar binary: ${outPath}`);
}

buildNitro();
patchNodeImports();
denoCompile();

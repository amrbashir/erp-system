import { execSync } from "node:child_process";
import { copyFileSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { builtinModules, createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const serverDir = resolve(root, "packages/server");
const binDir = resolve(import.meta.dirname, "../src-tauri/binaries");

function buildNitro() {
	// Clean .output first so deleted routes/files don't linger in the bundled
	// sidecar. Nitro overwrites in place but never prunes stale artifacts.
	rmSync(resolve(serverDir, ".output"), { recursive: true, force: true });
	execSync("pnpm run build", {
		env: {
			DEPLOY_TARGET: "desktop",
		},
		cwd: serverDir,
		stdio: "inherit",
	});
}

const PGLITE_BUNDLE = "_libs/electric-sql__pglite.mjs";

function patchPgliteBundle() {
	const NODE_BUILTINS = new Set(builtinModules.filter((m) => !m.startsWith("_")));
	const importPattern = new RegExp(
		`(from\\s+["'])(?!node:)(${[...NODE_BUILTINS].join("|")})(["'])`,
		"g",
	);

	const full = resolve(serverDir, ".output/server", PGLITE_BUNDLE);
	const original = readFileSync(full, "utf-8");
	// 1) node: prefix for bare builtin imports (deno-server preset leaves them bare)
	// 2) rename `postgres.wasm` URL -> `postgres.wasm.bin` so `deno compile --include`
	//    treats it as a data file rather than a WASM module (emscripten-style imports
	//    like GOT.mem fail wasm validation otherwise).
	const fixed = original
		.replace(importPattern, "$1node:$2$3")
		.replace(/(["'])\.\/postgres\.wasm\1/g, "$1./postgres.wasm.bin$1");
	if (fixed !== original) {
		writeFileSync(full, fixed);
		console.log(`✔ Patched ${full}`);
	}
}

// PGlite WASM + data files are loaded via `new URL("./postgres.{wasm,data}", import.meta.url)`
// + fs.readFile. Nitro's deno-server preset doesn't copy them next to the bundled
// _libs/electric-sql__pglite.mjs, and `deno compile` only includes statically-imported
// files. So: copy them in, then --include so they land in the deno-compile virtual FS.
// `.wasm` is renamed to `.wasm.bin` because deno-compile validates anything ending in
// `.wasm` as a WebAssembly module (see patchPgliteBundle).
const PGLITE_ASSETS = [
	{ src: "postgres.data", dest: "postgres.data" },
	{ src: "postgres.wasm", dest: "postgres.wasm.bin" },
];

function pgliteAssetPaths() {
	const serverRequire = createRequire(resolve(serverDir, "package.json"));
	// `./package.json` isn't in pglite's exports map; resolve the main entry instead
	// (dist/index.js) and walk up to the dist dir.
	const pgliteDist = resolve(serverRequire.resolve("@electric-sql/pglite"), "..");
	const libsDir = resolve(serverDir, ".output/server/_libs");
	return PGLITE_ASSETS.map(({ src, dest }) => ({
		src: resolve(pgliteDist, src),
		dest: resolve(libsDir, dest),
	}));
}

function copyPgliteAssets() {
	for (const { src, dest } of pgliteAssetPaths()) {
		copyFileSync(src, dest);
		console.log(`✔ Copied ${src} -> ${dest}`);
	}
}

function denoCompile() {
	const targetTriple = execSync("rustc -vV", { encoding: "utf-8" })
		.match(/host: (.+)/)?.[1]
		.trim();

	const entry = resolve(serverDir, ".output/server/index.mjs");
	const outPath = resolve(binDir, `kaname-erp-sidecar-${targetTriple}`);

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

	const includes = pgliteAssetPaths()
		.map(({ dest }) => `--include "${dest}"`)
		.join(" ");

	execSync(`deno compile --no-check ${perms} ${includes} --output "${outPath}" "${entry}"`, {
		stdio: "inherit",
	});

	console.log(`Sidecar binary: ${outPath}`);
}

buildNitro();
patchPgliteBundle();
copyPgliteAssets();
denoCompile();

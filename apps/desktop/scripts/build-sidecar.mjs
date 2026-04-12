import { execSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const serverDir = resolve(root, "packages/server");
const binDir = resolve(import.meta.dirname, "../src-tauri/binaries");

// Step 1: Nitro build (desktop config, deno-server preset)
console.log("Building Nitro desktop server…");
execSync("node build-desktop.mjs", { cwd: serverDir, stdio: "inherit" });

// Step 2: Deno compile
const targetTriple = execSync("rustc -vV", { encoding: "utf-8" })
	.match(/host: (.+)/)[1]
	.trim();

const entry = resolve(serverDir, ".output/server/index.mjs");
const outPath = resolve(binDir, `erp-sidecar-${targetTriple}`);

console.log(`Compiling sidecar for ${targetTriple}…`);
execSync(`deno compile --allow-all --output "${outPath}" "${entry}"`, {
	stdio: "inherit",
});

console.log(`Sidecar binary: ${outPath}`);

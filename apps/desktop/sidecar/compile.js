import { execSync } from "node:child_process";
import { resolve } from "node:path";

const targetTriple = execSync("rustc -vV", { encoding: "utf-8" })
  .match(/host: (.+)/)[1]
  .trim();

const outDir = resolve(import.meta.dirname, "../src-tauri/binaries");
const outPath = resolve(outDir, `erp-sidecar-${targetTriple}`);
const entry = resolve(import.meta.dirname, ".output/server/index.mjs");

execSync(`deno compile --allow-all --output "${outPath}" "${entry}"`, {
  stdio: "inherit",
});

import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";

import { defineConfig } from "tsdown/config";

import baseConfig from "./tsdown.config";

let devProcess: ChildProcess | undefined;

export default defineConfig({
  ...baseConfig,
  onSuccess: async (config) => {
    if (config.watch) {
      if (devProcess) {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", devProcess.pid!.toString(), "/f", "/t"], { shell: true });
        } else {
          // TODO:
        }
      }

      devProcess = spawn("pnpm", ["start:dev"], { shell: true, stdio: "inherit" });
      process.on("exit", () => (devProcess ? devProcess.kill() : {}));
    }
  },
});

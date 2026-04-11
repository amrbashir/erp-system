import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createNitro, build } from "nitro/builder";

import config from "./nitro.desktop.config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const nitro = await createNitro({ ...config, rootDir: resolve(__dirname) });
await build(nitro);
await nitro.close();

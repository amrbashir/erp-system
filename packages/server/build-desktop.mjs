import { resolve } from "node:path";

import { createNitro, build } from "nitro/builder";

import config from "./nitro.desktop.config.ts";

const nitro = await createNitro({ ...config, rootDir: resolve(".") });
await build(nitro);
await nitro.close();

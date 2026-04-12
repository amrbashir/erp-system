import { createNitro, build } from "nitro/builder";

import config from "./nitro.desktop.config.ts";

const nitro = await createNitro({ ...config, rootDir: import.meta.dirname });
await build(nitro);
await nitro.close();

export const IS_DESKTOP = import.meta.env.DEPLOY_TARGET === "desktop";

/** Desktop backend port: Nitro dev server in development, Rust sidecar in production. */
export const SIDECAR_URL = "http://localhost:11435";

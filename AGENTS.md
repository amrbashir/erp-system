# AGENTS.md

This file provides guidance to Agents when working with code in this repository.

## Commands

```bash
# Development
pnpm dev:web              # Start web app dev server (port 1420)
pnpm dev:desktop          # Start Tauri desktop app in dev mode

# Building
pnpm build:web            # Build web app
pnpm build:desktop        # Build desktop app (all platforms)

# Testing & Quality
pnpm test                 # Run Vitest tests
pnpm typecheck            # TypeScript type checking across all packages
pnpm fmt                  # Format code with oxfmt
pnpm fmt:check            # Check formatting without writing
```

## Import Conventions

- **`@/`** — intra-package alias, maps to the package's own source root (e.g. `@/lib/auth` instead of `../../lib/auth`)
- **`#db`** — build-time adapter switch, resolves to `adapters/pglite.ts` or `adapters/neon.ts` based on `DEPLOY_TARGET` env var in `nitro.config.ts`.
- **`@workspace/*`** — cross-package imports resolved via `workspace:*` deps in package.json + the package's `exports` field.
- **`./` relative imports** are allowed for same-directory imports only. Any `../` or deeper must use `@/` alias instead.
- Do not create new tsconfig path aliases for workspace packages — add the package as a `workspace:*` dependency and use its `exports` field.

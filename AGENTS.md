# AGENTS.md

This file provides guidance to Agents when working with code in this repository.

## Commands

```bash
# Development
pnpm dev:web              # Start web app dev server (port 1520)
pnpm dev:admin            # Start admin app dev server (port 1521)
pnpm dev:desktop          # Start Tauri desktop app in dev mode (web on port 1522)

# Building
pnpm build:web            # Build web app
pnpm build:desktop        # Build desktop app (all platforms)

# Quality
pnpm typecheck            # TypeScript type checking across all packages
pnpm lint                 # Lint with oxlint
pnpm lint:fix             # Auto-fix lint issues
pnpm fmt                  # Format code with oxfmt
pnpm fmt:check            # Check formatting without writing
```

## Import Conventions

- **`@/*`** - app-local src, **apps only**. Packages must not define path aliases: TS `paths` is program-wide, so a package alias breaks when its source is pulled into a consuming app.
- **`@workspace/<pkg>/...`** - cross-package and package self-references (e.g. `packages/ui` imports `@workspace/ui/lib/utils`). Use relative only for same-dir.
- **`#db`** - per-env DB adapter swap (pglite/neon/postgres), not a general alias.

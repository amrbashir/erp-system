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

# Workspace-scoped commands
pnpm -C apps/web <script>
pnpm -C packages/ui <script>
```

## Architecture

This is a **pnpm monorepo** with two apps and two shared packages:

```
apps/
  web/       — React 19 SSR web app (TanStack Start + Vite + Nitro)
  desktop/   — Tauri 2 desktop wrapper around the web app
packages/
  ui/        — Shared headless component library (@base-ui/react + CVA)
  i18n/      — Auto-generated i18n via Paraglide-js (en + ar locales)
```

### Web App (`apps/web`)

- **Router:** TanStack Router (file-based, type-safe) — routes live in `src/routes/`; `routeTree.gen.ts` is auto-generated (read-only, excluded from search)
- **SSR:** TanStack Start with Nitro backend
- **Styling:** TailwindCSS 4 with OKLCH color space CSS variables, light/dark mode
- **Path alias:** `@/*` → `src/`, `@workspace/ui/*` → `packages/ui/src/`

### Desktop App (`apps/desktop`)

- Tauri 2 (Rust backend in `src-tauri/`); frontend points to the web build output
- Dev URL: `localhost:1420`

### UI Package (`packages/ui`)

- Shadcn: Headless components built on `@base-ui/react`, styled with TailwindCSS
- Icon library: Phosphor Icons
- Font: Geist Variable
- RTL support enabled

### i18n Package (`packages/i18n`)

- Paraglide-js (code-first, strongly typed messages)
- Locales: `en` (base), `ar`
- Message files: `packages/i18n/messages/{locale}.json`
- Generated output is committed; run the Paraglide compiler when messages change

## Code Style

- **Formatter:** oxfmt — import sorting and Tailwind class sorting are enabled; semicolons required
- **Indentation:** 4-space tabs, LF line endings, max line length 100 (`.editorconfig`)
- **TypeScript:** strict mode — no unused locals/parameters, no fallthrough cases

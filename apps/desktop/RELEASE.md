# Desktop Release Process

## Prerequisites

- Tauri CLI installed (`pnpm tauri --version`)
- Tauri updater signing keys generated (see below)
- Cloudflare R2 bucket configured at `erp-releases.amrbashir.me`

## Generate Signing Keys

One-time setup:

```sh
pnpm tauri signer generate -w ~/.tauri/erp-system.key
```

This creates a keypair. The **public key** goes in `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`. The **private key** is set as env var during builds.

## Build a Release

```sh
TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/erp-system.key) \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" \
  pnpm tauri build
```

Output artifacts in `src-tauri/target/release/bundle/`:
- `nsis/ERP System_<version>_x64-setup.exe` — NSIS installer
- `nsis/ERP System_<version>_x64-setup.nsis.zip` — update bundle
- `nsis/ERP System_<version>_x64-setup.nsis.zip.sig` — update signature

## R2 Bucket Structure

```
erp-releases.amrbashir.me/
  updates/
    windows-x86_64/           # {target} = windows-x86_64
      x86_64/                 # {arch} = x86_64
        0.1.0                 # {current_version} — returns JSON
  artifacts/
    0.2.0/
      ERP-System_0.2.0_x64-setup.exe
      ERP-System_0.2.0_x64-setup.nsis.zip
      ERP-System_0.2.0_x64-setup.nsis.zip.sig
```

## Update JSON Manifest

The endpoint `updates/{target}/{arch}/{current_version}` must return JSON matching the Tauri updater spec. If no update is available, return 204 No Content.

When an update is available, return 200 with:

```json
{
  "version": "0.2.0",
  "url": "https://erp-releases.amrbashir.me/artifacts/0.2.0/ERP-System_0.2.0_x64-setup.nsis.zip",
  "signature": "<contents of .nsis.zip.sig file>",
  "notes": "Release notes here"
}
```

## Upload a Release

1. Build with signing keys (see above)
2. Upload installer + update bundle + signature to `artifacts/<version>/`
3. Upload or update the JSON manifest at `updates/<target>/<arch>/` — use a Cloudflare Worker or R2 custom domain to serve the version-comparison logic, or upload a static JSON file and return 204 when `current_version` matches latest

### Using wrangler to upload

```sh
# Upload artifacts
wrangler r2 object put erp-releases/artifacts/0.2.0/ERP-System_0.2.0_x64-setup.exe \
  --file src-tauri/target/release/bundle/nsis/ERP\ System_0.2.0_x64-setup.exe

wrangler r2 object put erp-releases/artifacts/0.2.0/ERP-System_0.2.0_x64-setup.nsis.zip \
  --file src-tauri/target/release/bundle/nsis/ERP\ System_0.2.0_x64-setup.nsis.zip

# Upload update manifest (create update.json with the JSON above)
wrangler r2 object put erp-releases/updates/windows-x86_64/x86_64/latest.json \
  --file update.json
```

## Notes

- No Windows code signing for v1 — users will see SmartScreen warnings on first install
- The `pubkey` field in `tauri.conf.json` must be set before building releases
- Install mode is `passive` (progress shown, no user interaction required)

# Development

Contributor and maintainer workflow. End users can skip this page.

## Repository layout

This repository **is** the standalone `pi-zai` package (repo root = package root):

```text
.
  src/           Extension source (TypeScript, strip-only)
  dist/          Build output (published to npm)
  docs/          User and operator documentation
  worker/        Cloudflare Worker ingest (telemetry)
  scripts/       Live benchmarks (cache-affinity A/B)
  test/          Shared Vitest helpers (unit tests live next to modules)
```

Source of truth for releases: [OnlineChefGroep/pi-zai](https://github.com/OnlineChefGroep/pi-zai).

A copy may also exist under `earendil-works/pi-mono` → `packages/pi-zai` for Pi integration tests. Ship user-facing changes here; do not rely on the monorepo fork for releases.

## Requirements

- Node **>= 22.19.0**
- Pi packages **>= 0.80.0** (`@earendil-works/pi-coding-agent` as devDependency for tests)

## Build and test

From the repo root:

```bash
npm run clean && npm run build
npm test
npm run lint
```

## Local install in Pi

```bash
npm run build
pi install file:/absolute/path/to/pi-zai
/reload
```

Project settings example (`.pi/settings.json`):

```json
{
  "zai": {
    "metrics": { "mode": "local" },
    "telemetry": { "mode": "off" }
  }
}
```

Opt-in remote telemetry: set `"telemetry": { "mode": "aggregate" }`, `/reload`, then `/zai-telemetry enable`.

## Live cache-affinity benchmark

Requires a real `ZAI_API_KEY` and network:

```bash
export ZAI_API_KEY='...'
npm run benchmark:cache-affinity
```

Optional JSON output: `PI_ZAI_AB_OUTPUT=/tmp/ab.json`.

Dev-only `PI_ZAI_AB_*` environment variables configure this script only. Runtime extension settings ignore `PI_ZAI_*` overrides.

This is separate from `/zai-benchmark` (manifest A0–A3, local SQLite run tracking).

## Boundary tests

Runtime guards in `src/boundary.test.ts` (mock-only — no LLM tokens, no network):

- Uses a fake `ExtensionAPI` and a global `fetch` spy; never starts a real Pi session
- `runExtensionLifecycle()` fires `pi.on()` handlers from `index.ts` in-process (including tool execution hooks) to cover a typical session path
- Full lifecycle does not call `fetch` when telemetry is off
- Aggregate upload calls `fetch` only via `telemetry/uploader.ts`
- Provider registration and `PI_ZAI_*` env overrides are verified at runtime

Commands that can fetch (`/zai-doctor`, `/zai-usage`) are not exercised here; they require explicit user invocation. Tool hooks record names/durations/errors only — never args or results.

## Telemetry worker deploy

```bash
cd worker/telemetry
npm install
npm run check
npx wrangler deploy
```

Bind route `api.chefgroep.online/pi-zai/telemetry/v1/aggregate` to the deployed worker. Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Release (maintainers)

```bash
npm run clean && npm run build && npm run lint && npm test
npm pack --dry-run
```

Changelog: `CHANGELOG.md`. Breaking changes → minor bump (0.2.0+).

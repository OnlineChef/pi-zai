# Native Pi Z.ai Extension Plan

Status: proposed implementation plan  
Repository: `OnlineChefGroep/pi-zai`  
Target: native Pi + official Z.ai providers  
Primary model: user-selected GLM model, normally GLM-5.2  

## 1. Decision

Use the existing `OnlineChefGroep/pi-zai` repository.

Do not create a new repository, package, provider, proxy, agent runtime, model router, self-hosted inference layer, or multi-CLI abstraction for this work.

The extension is specifically responsible for improving Pi's native Z.ai integration while leaving Pi in control of credentials, providers, models, streaming, retries, thinking levels, tools, and sessions.

A separate repository would add release coordination, duplicated configuration, extra compatibility surfaces, and more maintenance without creating a useful boundary. A host-independent core can be extracted later only if another CLI has a proven implementation need. That is not part of this plan.

## 2. End-user outcome

The extension should provide:

- reliable visibility into input, cached input, output, latency, retries, and estimated API-equivalent cost;
- explanations for cache-segment changes;
- stable request, query, and session correlation;
- actionable transport diagnostics;
- optional, conservative prompt stabilization;
- reproducible benchmarks showing whether a feature actually reduces new input or latency.

The extension must not claim savings that cannot be measured. In Coding Plan mode, estimated dollar cost is an API-equivalent comparison, not the user's subscription invoice.

## 3. Hard scope

### 3.1 In scope

1. Remove overrides of Pi's built-in `zai` and `zai-coding-cn` providers.
2. Preserve Pi's native authentication and model registry.
3. Normalize Z.ai thinking fields through Pi's public payload hook only.
4. Measure cache usage from model usage data.
5. Fingerprint the stable system prompt and complete active tool definitions.
6. Detect why the effective cache segment changed.
7. Generate local session, query, request, and attempt identifiers.
8. Record request timing and response metadata exposed by Pi.
9. Classify known transport and provider failures.
10. Add local-only, bounded metrics persistence.
11. Add operator commands for status, diagnostics, data retention, and benchmarks.
12. Implement a benchmark harness for native Pi + Z.ai behavior.
13. Add an optional `safe` prompt-stability mode based only on explicit markers.
14. Keep experimental session-affinity headers disabled by default.

### 3.2 Explicitly out of scope

Do not implement any of the following:

- self-hosted GLM models;
- GPU infrastructure;
- vLLM or SGLang;
- Hugging Face model downloading or quantization;
- an OpenAI-compatible proxy;
- a replacement HTTP client;
- an alternative Z.ai provider;
- credential or environment-variable management;
- automatic model selection or model routing;
- automatic GLM-5.2 to GLM-4.7 switching;
- hidden subagents;
- a second model call on normal turns;
- OpenCode, OpenClaude, Claude Code, or Factory Droid adapters;
- remote telemetry, analytics, or hosted dashboards;
- storing prompts, model output, source files, tool output, diffs, API keys, or authorization headers.

### 3.3 Optional GLM-4.7 work

GLM-4.7 context compilation is not part of the first implementation milestone.

It may be evaluated later as a separate experimental feature for only:

- Pi compaction of very large dynamic context;
- reduction of extremely large, newly generated tool output.

It must remain disabled by default and must never be used to warm GLM-5.2 cache, replace GLM-5.2 reasoning, route normal prompts, or run once per turn.

## 4. Native Pi boundary

Pi remains the owner of:

- credentials and auth storage;
- `ZAI_API_KEY` and other provider configuration;
- provider registration;
- endpoint selection;
- model catalog and selected model;
- thinking-level selection;
- request streaming;
- response parsing;
- tool execution;
- retry scheduling;
- session lifecycle.

`pi-zai` may use only public Pi extension APIs and exported package APIs.

### 4.1 Correct implementation

```ts
pi.on("before_provider_request", (event, ctx) => {
  if (!isNativeZaiModel(ctx.model)) return;

  return normalizeZaiPayload(event.payload, {
    preserveThinking: config.preserveThinking,
  });
});
```

```ts
pi.on("before_provider_headers", (event, ctx) => {
  if (!isNativeZaiModel(ctx.model)) return;

  applyCorrelationHeaders(event.headers, getCurrentAttempt());
});
```

```ts
pi.on("after_provider_response", (event, ctx) => {
  if (!isNativeZaiModel(ctx.model)) return;

  recordResponseMetadata({
    status: event.status,
    headers: redactAndSelectHeaders(event.headers),
  });
});
```

### 4.2 Incorrect implementation

```ts
// Do not replace Pi's provider.
pi.registerProvider("zai", { /* ... */ });
```

```ts
// Do not remove and recreate native providers.
pi.unregisterProvider("zai");
```

```ts
// Do not take ownership of Pi's credential environment.
const key = process.env.ZAI_API_KEY;
process.env.ZAI_API_KEY = anotherValue;
```

```ts
// Do not route the user's selected model.
await pi.setModel(glm47);
```

```ts
// Do not introduce an invisible model call on every prompt.
pi.on("before_agent_start", async () => runHelperModel());
```

## 5. Minimal architecture

Keep the implementation deliberately small.

```text
src/
├── index.ts
├── config.ts
├── native-boundary.ts
├── correlation.ts
├── telemetry.ts
├── retention.ts
├── diagnostics.ts
├── benchmark.ts
├── cache/
│   ├── fingerprint.ts
│   ├── segment.ts
│   └── prompt-stability.ts
└── commands/
    ├── status.ts
    ├── data.ts
    ├── doctor.ts
    └── benchmark.ts
```

Reuse existing modules where practical. Do not reorganize the whole repository merely to match this illustrative tree.

### 5.1 Dependency policy

Add no runtime dependencies unless the feature cannot be implemented safely with Node.js built-ins and Pi's exported APIs.

Expected built-ins:

- `node:crypto` for SHA-256;
- `node:fs` and `node:fs/promises` for local JSONL storage;
- `node:path` for state paths;
- `node:dns/promises`, `node:net`, and `node:tls` for diagnostics;
- `node:perf_hooks` for monotonic timing.

Do not add SQLite, DuckDB, Redis, an ORM, a metrics SDK, or an HTTP proxy.

## 6. Runtime weight

This is a small-to-medium extension change, not a new platform.

The minimal release should require:

- no extra model calls;
- no extra provider requests;
- no background service;
- no daemon;
- no database;
- no network listener;
- no remote storage;
- no global file watcher;
- no periodic timer.

Normal per-turn work consists of:

1. canonicalizing a limited set of metadata;
2. calculating SHA-256 fingerprints;
3. updating in-memory counters;
4. appending one small JSON line when persistence is enabled.

Performance acceptance targets:

- observe-only mode adds less than 5 ms median local hook overhead per model turn;
- p95 local hook overhead remains below 15 ms;
- no observable TTFT change caused by plugin CPU work;
- normal memory overhead remains below 2 MB per Pi process;
- one persisted request record remains below 2 KB under normal conditions.

These are test gates, not assumptions. The benchmark must report violations.

## 7. Configuration

Use Pi's existing global and project settings files. Do not add `PI_ZAI_*` environment overrides.

Recommended initial configuration:

```json
{
  "zai": {
    "preserveThinking": false,
    "promptStability": {
      "mode": "observe"
    },
    "sessionAffinity": "off",
    "metrics": {
      "enabled": true,
      "persist": true,
      "retentionDays": 14,
      "maxProjectBytes": 20971520,
      "maxFileBytes": 5242880,
      "includeRequestIds": true
    }
  }
}
```

Defaults:

| Setting | Default | Meaning |
|---|---:|---|
| `preserveThinking` | `false` | Do not replay historical hidden reasoning |
| `promptStability.mode` | `observe` | Analyze only; do not rewrite the prompt |
| `sessionAffinity` | `off` | Do not send experimental affinity headers |
| `metrics.enabled` | `true` | Maintain in-memory session metrics |
| `metrics.persist` | `true` | Store privacy-reduced metrics locally |
| `metrics.retentionDays` | `14` | Delete files older than 14 days |
| `metrics.maxProjectBytes` | `20 MiB` | Maximum metrics size per project identity |
| `metrics.maxFileBytes` | `5 MiB` | Roll over the active JSONL file at this size |
| `metrics.includeRequestIds` | `true` | Store generated correlation IDs locally |

Setting `metrics.persist` to `false` must leave only session-memory counters. No disk file should be created.

## 8. Metrics location and privacy

### 8.1 Storage location

Persistent data stays on the user's machine under Pi's user state directory:

```text
~/.pi/agent/state/pi-zai/
├── projects/
│   └── <project-hash>/
│       ├── metrics-2026-07-12-0001.jsonl
│       ├── metrics-2026-07-13-0001.jsonl
│       └── state.json
└── benchmarks/
    └── <benchmark-run-id>/
        ├── manifest.json
        ├── observations.jsonl
        └── report.json
```

Use Pi's exported user-directory resolver instead of hardcoding `~/.pi/agent`.

The project directory name must be derived from a salted or namespaced SHA-256 hash of the canonical working directory. Do not expose the raw project path in a filename.

Example:

```ts
const projectId = sha256(`pi-zai:project:${canonicalCwd}`).slice(0, 16);
```

### 8.2 Data that may be stored

Allowed fields:

```json
{
  "schema": 1,
  "timestamp": "2026-07-12T10:15:32.441Z",
  "projectId": "4c17c31d42fa8a6b",
  "sessionIdHash": "02f9e832e9f62ca1",
  "queryId": "q-0042-43ecad15",
  "requestId": "q-0042-43ecad15-a1",
  "attempt": 1,
  "provider": "zai",
  "model": "glm-5.2",
  "endpointKind": "coding-plan",
  "thinkingLevel": "high",
  "systemFingerprint": "sha256:...",
  "toolsetFingerprint": "sha256:...",
  "payloadFingerprint": "sha256:...",
  "inputTokens": 84122,
  "cacheReadTokens": 77201,
  "outputTokens": 1894,
  "requestToHeadersMs": 604,
  "requestToFirstDeltaMs": 1019,
  "totalMs": 12742,
  "httpStatus": 200,
  "errorCategory": null
}
```

### 8.3 Data that must never be stored

Never persist:

- API keys;
- authorization, cookie, or API-key headers;
- raw session IDs received from Pi;
- complete request headers;
- prompts;
- system-prompt text;
- assistant output;
- reasoning content;
- tool arguments;
- tool results;
- source code;
- file paths;
- git diffs;
- shell output;
- environment-variable values;
- full exception objects that may contain request data.

Only fingerprints, counters, timings, safe enums, selected status codes, and generated correlation IDs may be persisted.

### 8.4 No remote telemetry

The package must contain no remote metrics endpoint, analytics SDK, phone-home logic, crash uploader, or automatic benchmark upload.

Data may leave the machine only through an explicit user export command that writes to a path selected by the user.

## 9. Rotation and cleanup

Rotation must be deterministic, synchronous with ordinary extension events, and require no background worker.

### 9.1 Rollover

Open one JSONL file per project. Roll over when either condition is met:

- the UTC date changes; or
- the active file reaches `metrics.maxFileBytes`.

Use monotonically numbered files for multiple rollovers on the same date:

```text
metrics-2026-07-12-0001.jsonl
metrics-2026-07-12-0002.jsonl
```

### 9.2 Cleanup triggers

Run lightweight cleanup only:

- once during `session_start`;
- immediately after a rollover;
- after the user changes retention settings;
- after a benchmark completes.

Do not run a timer.

### 9.3 Deletion order

1. Delete files older than `retentionDays`.
2. Calculate remaining project usage.
3. If usage exceeds `maxProjectBytes`, delete the oldest closed files first.
4. Never delete the active file while it is open.
5. If only the active file remains and the limit is exceeded, roll it over and then apply cleanup.

All deletions must be restricted to the resolved `pi-zai` state root. Refuse deletion when a path escapes that root after resolution.

### 9.4 Corrupt files

A corrupt JSONL line must not prevent startup or deletion. Skip the line during reporting and increment a local corruption counter.

A corrupt `state.json` should be renamed to:

```text
state.corrupt-<timestamp>.json
```

Then recreate an empty state file.

## 10. Wipe and export commands

Add one minimal data-management command:

```text
/zai-data status
/zai-data clear
/zai-data clear-all
/zai-data export <path>
```

Behavior:

### `/zai-data status`

Show:

- whether persistence is enabled;
- resolved state directory;
- current project's hashed ID;
- file count;
- total bytes;
- oldest and newest record timestamps;
- retention configuration.

Do not show raw project paths unless Pi already displays that path elsewhere and the user explicitly requests verbose output.

### `/zai-data clear`

Delete metrics and benchmark data for the current project identity after confirmation in interactive mode.

In non-interactive mode, require an explicit `--yes` argument.

### `/zai-data clear-all`

Delete all `pi-zai` local metrics and benchmark data after a stronger confirmation.

This command must not modify:

- Pi sessions;
- Pi settings;
- auth files;
- provider configuration;
- any project file.

### `/zai-data export <path>`

Export privacy-reduced metrics only. Do not add prompts or raw request payloads to exports.

## 11. Cache fingerprinting

### 11.1 System prompt

Fingerprint the stable prefix, not the entire raw prompt when an explicit dynamic marker is present.

Supported marker:

```text
--- dynamic context ---
```

Example:

```text
You are a coding agent.
Follow AGENTS.md.
Use the available tools conservatively.

--- dynamic context ---
Current branch: feature/cache-metrics
Current time: 2026-07-12T10:00:00Z
Latest failure: test_cache_rotation
```

In `observe` mode:

- calculate stable and volatile fingerprints;
- report that dynamic context exists;
- do not modify the prompt.

In `safe` mode:

- only operate on the explicit marker;
- preserve every byte within both sections except normalized line endings;
- ensure the dynamic section remains after the stable section;
- do not heuristically move arbitrary lines.

Incorrect behavior:

- identifying timestamps with regex and moving them automatically;
- rewriting prose;
- sorting system-prompt paragraphs;
- deleting duplicated-looking instructions;
- summarizing the system prompt.

### 11.2 Tool fingerprint

Fingerprint complete active tool information, not only names.

Include stable representations of:

- name;
- description;
- parameter JSON schema;
- prompt guidelines;
- source identity where stable and relevant.

Canonicalization rules:

1. sort tools by name;
2. recursively sort object keys;
3. preserve array order unless the array is documented as order-insensitive;
4. omit runtime functions and transient object identities;
5. serialize with stable JSON;
6. hash using SHA-256.

Do not change Pi's actual tool order in v1. Measure first.

## 12. Correlation model

Generate:

- a stable hashed session identity for the Pi session;
- one query ID per logical user turn;
- one request ID per provider attempt;
- an explicit attempt number.

Example:

```text
session hash:  sess-9f2718c21803810d
query ID:      q-0042-43ecad15
request ID:    q-0042-43ecad15-a1
attempt:       1
```

A retry receives a new request ID but retains the query ID:

```text
q-0042-43ecad15-a2
```

Persist a payload fingerprint for each attempt. This makes it possible to verify whether retries were byte-equivalent at the semantic payload level without storing the payload.

## 13. Session affinity

Session-affinity headers are experimental and disabled by default.

```json
{
  "zai": {
    "sessionAffinity": "off"
  }
}
```

Allowed modes:

- `off`: send nothing;
- `observe`: calculate IDs and report capability, but send nothing;
- `experimental`: send only the specifically approved correlation headers.

Do not spoof ZCode identity headers, user agents, referers, application versions, or client names.

Do not enable experimental mode globally until the benchmark demonstrates a material cache or latency benefit without increased failure or throttling rates.

## 14. Diagnostics

`/zai-doctor` should inspect, without modifying configuration:

- Pi version;
- `pi-zai` version;
- selected provider and model;
- endpoint kind;
- credential source label without credential value;
- IPv4 and IPv6 DNS resolution;
- TCP connection timing;
- TLS handshake timing;
- certificate issuer, expiry, and hostname match;
- ALPN result;
- proxy variable names and presence, not secret values;
- `NODE_EXTRA_CA_CERTS` presence and path;
- Pi retry configuration when publicly exposed;
- most recent error category;
- metrics storage health;
- retention status.

Error categories:

```text
dns
tcp_connect
tls
certificate
proxy
timeout_before_headers
http_4xx
http_429
http_5xx
stream_interrupted
context_overflow
authentication
unknown_transport
```

Do not take ownership of retry scheduling in v1.

## 15. Commands

Keep the command set compact:

```text
/zai
/zai-cache
/zai-usage
/zai-transport
/zai-doctor
/zai-data
/zai-benchmark
```

Avoid adding separate commands for every setting. Configuration belongs in Pi settings.

## 16. Benchmark plan

The benchmark is part of the first release because optimizations must be evidence-based.

### 16.1 Variants

Compare:

- `A0`: native Pi without `pi-zai` loaded;
- `A1`: native Pi with `pi-zai`, observe-only;
- `A2`: `A1` plus explicit-marker safe prompt stabilization;
- `A3`: `A2` plus experimental session affinity.

GLM-4.7 is not included in this benchmark. It belongs to a later optional experiment.

### 16.2 Controlled variables

Keep identical across variants:

- Pi version;
- `pi-zai` commit except for the selected feature flag;
- provider;
- model;
- thinking level;
- repository state;
- prompt fixtures;
- active tools and tool definitions;
- network location;
- benchmark time window;
- retry settings;
- context-compaction settings.

Record unavoidable differences such as provider load and clock time.

### 16.3 Scenarios

#### Scenario 1: stable conversation

Run 12 turns with:

- unchanged system prompt;
- unchanged toolset;
- small follow-up requests;
- no compaction;
- no intentional failures.

Purpose: establish best-case cache reuse and plugin overhead.

#### Scenario 2: explicit dynamic context

Run 12 turns where only the content below `--- dynamic context ---` changes:

- timestamp;
- branch name;
- git status summary;
- latest test failure.

Purpose: measure whether safe placement improves cache reuse without semantic change.

#### Scenario 3: tool-definition drift

Run controlled cohorts with:

1. identical tool definitions;
2. changed tool order only;
3. changed description only;
4. changed JSON schema only;
5. one additional MCP tool.

Purpose: attribute cache-segment changes to exact tool metadata changes.

#### Scenario 4: realistic coding session

Run 20 to 30 turns containing:

- file reads;
- searches;
- diffs;
- test runs;
- one failing test cycle;
- one successful repair;
- one compaction.

Purpose: represent actual long-running Pi usage.

#### Scenario 5: controlled retry and failure

Where safely reproducible, exercise:

- connection failure before response headers;
- timeout before response headers;
- interrupted stream after first delta;
- HTTP 429;
- HTTP 500.

Purpose:

- verify error classification;
- verify request/query/attempt correlation;
- verify payload fingerprint consistency;
- detect potentially duplicated work;
- verify that metrics remain valid after failure.

Do not create artificial production load or bypass provider limits.

### 16.4 Required sample size

For each variant and principal scenario:

- at least 5 independent sessions;
- at least 12 model turns per session;
- at least 60 model turns per variant.

For four variants, target at least 240 measured turns before making default-setting decisions.

### 16.5 Per-attempt fields

Capture:

```text
timestamp
benchmark run ID
variant
scenario
cohort
session hash
query ID
request ID
attempt
provider
model
thinking level
system fingerprint
toolset fingerprint
payload fingerprint
input tokens
cache-read tokens
cache-write tokens when available
output tokens
request-start timestamp
headers-received timestamp
first-thinking-delta timestamp
first-text-delta timestamp
first-tool-delta timestamp
response-end timestamp
TTFH
TTFT
total latency
output tokens per second
HTTP status
error category
estimated API-equivalent cost
```

### 16.6 Quality checks

Token and latency improvements are insufficient if behavior regresses.

For fixture tasks, evaluate:

- task completion;
- tool-call validity;
- file-selection correctness;
- no omitted required constraint;
- tests or verification executed when required;
- no unexpected prompt text appearing in user-visible output;
- semantic equivalence between `observe` and `safe` variants.

### 16.7 Acceptance gates

#### Observe-only

Must meet all:

- zero extra provider requests;
- zero extra model calls;
- zero provider, auth, model, or endpoint changes;
- less than 5 ms median local hook overhead;
- less than 15 ms p95 local hook overhead;
- no response or tool-call changes attributable to plugin behavior.

#### Safe prompt stabilization

May become recommended only if it achieves either:

- at least 10 percentage points higher cache ratio; or
- at least 15% fewer newly processed input tokens;

and all of the following remain true:

- no quality regression;
- no tool-call regression;
- no increased provider-error rate;
- no increased transport-error rate;
- no meaningful p95 latency regression.

#### Experimental session affinity

May become recommended only if it achieves either:

- at least 10 percentage points higher cache ratio; or
- at least 15% lower median TTFH or TTFT;

and:

- HTTP 429 rate does not increase;
- transport failures do not increase;
- sessions remain isolated;
- request payload behavior remains unchanged;
- no spoofed ZCode identity is required.

### 16.8 Benchmark output

Store benchmark output locally:

```text
~/.pi/agent/state/pi-zai/benchmarks/<run-id>/
```

Generate:

- `manifest.json`: configuration and software versions;
- `observations.jsonl`: privacy-reduced measurements;
- `report.json`: aggregate statistics and acceptance-gate results;
- `report.md`: human-readable comparison.

No automatic upload.

## 17. Minimal implementation sequence

Use three focused pull requests rather than six broad refactors.

### PR 1: restore native boundary

- remove built-in provider re-registration and unregister logic;
- remove plugin credential-env overrides;
- retain only the custom `zai-platform` provider if it is explicitly configured and demonstrably required, otherwise remove it from default runtime;
- normalize thinking through `before_provider_request`;
- add native-boundary contract tests;
- update README and configuration docs.

Acceptance:

- selected provider, model, endpoint, and auth source are identical with and without the extension;
- loading or unloading `pi-zai` never changes Pi's environment;
- no extra request is made.

### PR 2: local telemetry, cache fingerprints, and retention

- implement complete tool fingerprinting;
- implement system-prompt segment analysis;
- add session/query/request/attempt correlation;
- implement in-memory metrics;
- implement privacy-reduced JSONL persistence;
- implement rollover, cleanup, status, clear, clear-all, and export;
- add `/zai-cache`, `/zai-usage`, and `/zai-data` output;
- add corruption and path-safety tests.

Acceptance:

- no sensitive content is persisted;
- retention limits are enforced;
- all data remains under the resolved Pi user-state directory;
- wipe commands cannot escape that directory.

### PR 3: diagnostics, safe marker mode, and benchmark harness

- implement transport diagnostics;
- implement error classification;
- implement `off`, `observe`, and explicit-marker `safe` prompt modes;
- add experimental affinity mode, default off;
- add benchmark fixtures, runner, reports, and acceptance gates;
- run baseline comparisons before changing any default.

Acceptance:

- observe-only meets overhead gates;
- safe mode modifies only explicitly marked prompts;
- experimental features remain disabled unless benchmark evidence supports them.

## 18. Test plan

Required unit tests:

- canonical JSON stability;
- tool-order-independent fingerprint when only discovery order changes;
- fingerprint change on tool description or schema change;
- explicit dynamic-marker parsing;
- safe mode idempotence;
- no heuristic prompt rewrite;
- request/query/attempt ID lifecycle;
- payload-fingerprint stability across equivalent objects;
- redaction allowlist;
- JSONL rollover;
- retention by age;
- retention by byte limit;
- active-file handling;
- corrupt-line handling;
- state-root path traversal rejection;
- project-path hashing;
- wipe current project;
- wipe all state;
- persistence disabled means no disk writes.

Required integration/contract tests:

- native Pi provider remains unchanged;
- native Pi model remains unchanged;
- native Pi auth resolution remains unchanged;
- no process environment mutation;
- no additional model call;
- no additional provider request;
- hook feature detection fails open;
- metrics failures never block a model turn;
- read-only or unwritable state directory degrades to in-memory metrics with one warning.

## 19. Failure behavior

All observability features must fail open.

If hashing, persistence, cleanup, diagnostics, or reporting fails:

- do not cancel the model turn;
- do not alter the model selection;
- do not retry the provider request;
- do not write outside the state root;
- disable only the failing optional feature for the current session;
- emit one concise warning rather than warning on every turn.

Prompt normalization is the exception: if safe-mode validation fails, return the original prompt unchanged.

## 20. Definition of done

The minimal native Pi release is complete when:

1. `pi-zai` no longer replaces Pi's native Z.ai provider or credentials.
2. Normal operation makes no extra network or model calls.
3. Cache, latency, usage, and retry metrics are trustworthy and privacy-reduced.
4. Persistent metrics stay under the local Pi user-state directory.
5. Rotation and wipes are tested and bounded.
6. No prompts, source code, tool output, secrets, or raw paths are persisted.
7. Safe prompt mode changes only explicitly marked dynamic context.
8. Experimental affinity is disabled by default.
9. The benchmark can compare native, observe, safe, and affinity variants.
10. Defaults change only when benchmark acceptance gates pass.
11. GLM-4.7 offload, other CLIs, self-hosting, quantization, and GPU infrastructure remain outside the release scope.

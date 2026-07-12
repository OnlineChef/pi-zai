# Telemetry and Storage Plan

Status: proposed  
Repository: `OnlineChefGroep/pi-zai`  
Scope: native Pi extension only  
Supersedes: JSONL as the primary operational metrics store in `native-pi-zai-plan.md`  

## 1. Decision

Use one local SQLite database as the source of truth for usage, cache, latency, retry, transport, and benchmark measurements.

Do not use rotating JSONL files as the normal operational store.

JSON and Markdown remain export and report formats only:

- SQLite: persistent source of truth;
- JSON: explicit machine-readable export;
- Markdown: generated human-readable benchmark report;
- JSONL: optional one-time debug export, never the default database.

Use the existing `OnlineChefGroep/pi-zai` repository. Do not create another repository for telemetry.

## 2. Why SQLite

SQLite is a better fit than JSONL for this extension because it provides:

- one bounded local file;
- indexed queries for `/zai-usage`, `/zai-cache`, and `/zai-transport`;
- atomic writes;
- safe concurrent access from multiple Pi processes when configured correctly;
- retention through `DELETE` statements instead of file scanning;
- daily and per-project aggregation without parsing every historical record;
- schema versioning and migrations;
- straightforward privacy-preserving exports;
- simple wipe operations;
- no database server or daemon.

The package already requires Node.js 22.19 or newer. Prefer the built-in `node:sqlite` API to avoid a runtime dependency, native addon, post-install compilation, or separate binary.

Keep all SQLite-specific code behind a small storage adapter. If `node:sqlite` is unavailable or database opening fails, degrade to session-memory metrics and emit one warning. Never block a model turn.

## 3. What telemetry can improve

Telemetry from multiple installations cannot improve GLM itself or alter Z.ai's backend.

It can improve `pi-zai` by providing evidence for:

- Pi-version compatibility regressions;
- cache-ratio changes across extension releases;
- whether safe prompt stabilization reduces new input;
- whether experimental session affinity improves cache or latency;
- transport-error distributions;
- retry duplication and payload drift;
- missing usage fields in particular Pi/provider combinations;
- plugin CPU and storage overhead;
- which defaults are safe enough to recommend;
- whether a feature should be removed because it has no measurable benefit.

Do not use telemetry to collect prompts, code, tool output, user behavior content, or data for model training.

## 4. Telemetry levels

Telemetry must be explicit, understandable, and independently configurable from local metrics.

### Level 0: off

```json
{
  "zai": {
    "metrics": {
      "mode": "off"
    }
  }
}
```

Behavior:

- no persistent database;
- no local historical overview;
- no remote requests;
- only transient counters required for the current command output, if any.

Use for users who want no persistent observability.

### Level 1: local only

Default and recommended mode.

```json
{
  "zai": {
    "metrics": {
      "mode": "local"
    },
    "telemetry": {
      "mode": "off"
    }
  }
}
```

Behavior:

- store privacy-reduced operational metrics in local SQLite;
- provide local usage and cache overview;
- perform local retention and wipes;
- make no telemetry network requests;
- never upload automatically.

### Level 2: anonymous aggregate

Explicit opt-in.

```json
{
  "zai": {
    "metrics": {
      "mode": "local"
    },
    "telemetry": {
      "mode": "anonymous-aggregate"
    }
  }
}
```

Behavior:

- keep full allowed metrics locally;
- calculate a small daily aggregate locally;
- upload only aggregate counters and histograms;
- upload at most once per 24 hours and only after a completed Pi session;
- no raw turn or request records;
- no project hash;
- no session, query, or request IDs;
- no stable installation ID;
- no IP, location, username, hostname, working directory, repository, or organization field in the payload;
- no retry of failed telemetry uploads during the active agent turn.

Because no stable identifier is sent, this level supports population-level comparisons but not reliable per-installation cohorts or remote deletion by installation.

### Level 3: explicit diagnostic or benchmark contribution

One-time action only, never a persistent passive mode.

Commands:

```text
/zai-telemetry preview-diagnostic
/zai-telemetry submit-diagnostic
/zai-benchmark submit <run-id>
```

Behavior:

- generate a local preview first;
- require confirmation before upload;
- include only fields shown in the preview;
- assign an upload ID so the user can reference or request deletion of that submitted bundle;
- use a short server-side retention period;
- never include prompts, code, tool output, raw paths, credentials, or authorization headers.

Diagnostics may include hashed local correlation IDs only when necessary to connect attempts within the submitted bundle. They must be salted specifically for that upload and must not match local database hashes.

## 5. Recommended default

```json
{
  "zai": {
    "metrics": {
      "mode": "local",
      "retentionDays": 30,
      "rollupRetentionDays": 180,
      "maxDatabaseBytes": 33554432
    },
    "telemetry": {
      "mode": "off"
    }
  }
}
```

Defaults:

| Setting | Default | Meaning |
|---|---:|---|
| `metrics.mode` | `local` | Keep local SQLite metrics |
| `metrics.retentionDays` | `30` | Retain detailed attempt rows for 30 days |
| `metrics.rollupRetentionDays` | `180` | Retain daily aggregates for 180 days |
| `metrics.maxDatabaseBytes` | `32 MiB` | Soft maximum for the local database |
| `telemetry.mode` | `off` | No remote telemetry |

Telemetry consent must never be inferred from installation, upgrade, use of a benchmark command, or acceptance of package terms.

## 6. Local database location

Store one database in Pi's resolved user state directory:

```text
<pi-user-state>/pi-zai/metrics.sqlite3
```

Possible companion files created by SQLite:

```text
metrics.sqlite3-wal
metrics.sqlite3-shm
```

Do not put the database inside the user's repository. Do not create a database per project unless a proven concurrency or isolation problem requires it.

A single database keeps cross-project usage summaries possible while project identity remains a local hash.

## 7. Minimal schema

### 7.1 Schema metadata

```sql
CREATE TABLE schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;
```

Required keys:

- `schema_version`;
- `created_at`;
- `last_cleanup_at`.

### 7.2 Projects

```sql
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
) STRICT;
```

`project_id` is a namespaced SHA-256 hash of the canonical working directory. Never store the raw path.

### 7.3 Provider attempts

```sql
CREATE TABLE provider_attempts (
  id INTEGER PRIMARY KEY,
  occurred_at INTEGER NOT NULL,
  project_id TEXT,
  session_hash TEXT,
  query_id TEXT,
  request_id TEXT,
  attempt INTEGER NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  endpoint_kind TEXT NOT NULL,
  thinking_level TEXT,
  pi_version TEXT,
  extension_version TEXT NOT NULL,
  system_fingerprint TEXT,
  toolset_fingerprint TEXT,
  payload_fingerprint TEXT,
  input_tokens INTEGER,
  cache_read_tokens INTEGER,
  cache_write_tokens INTEGER,
  output_tokens INTEGER,
  request_to_headers_ms REAL,
  request_to_first_delta_ms REAL,
  total_ms REAL,
  http_status INTEGER,
  error_category TEXT,
  estimated_api_cost_microusd INTEGER,
  FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
) STRICT;
```

Use integer microdollars rather than floating-point dollars.

### 7.4 Daily rollups

```sql
CREATE TABLE daily_rollups (
  day TEXT NOT NULL,
  project_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  extension_version TEXT NOT NULL,
  turn_count INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL,
  cache_read_tokens INTEGER NOT NULL,
  cache_write_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  estimated_api_cost_microusd INTEGER NOT NULL,
  PRIMARY KEY(day, project_id, provider, model, extension_version)
) STRICT;
```

Daily rollups make long-term usage views cheap after detailed rows expire.

### 7.5 Benchmarks

Keep benchmark metadata and observations in the same database unless benchmark payload size becomes excessive.

```sql
CREATE TABLE benchmark_runs (
  run_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  variant TEXT NOT NULL,
  scenario TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  report_json TEXT
) STRICT;
```

Benchmark JSON in this table must still contain only privacy-reduced measurements. Markdown reports are generated on demand and do not need to be stored permanently.

## 8. Indexes

Keep indexes minimal:

```sql
CREATE INDEX attempts_by_time
ON provider_attempts(occurred_at);

CREATE INDEX attempts_by_project_time
ON provider_attempts(project_id, occurred_at);

CREATE INDEX attempts_by_model_time
ON provider_attempts(provider, model, occurred_at);

CREATE INDEX attempts_by_query
ON provider_attempts(query_id, attempt);
```

Do not index every column. The database is small and write simplicity matters more than arbitrary ad hoc queries.

## 9. SQLite configuration

On database open:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = MEMORY;
PRAGMA auto_vacuum = INCREMENTAL;
PRAGMA busy_timeout = 25;
```

Rules:

- use prepared statements;
- insert at provider-attempt completion, not per stream delta;
- wrap related writes in one short transaction;
- never hold a transaction while waiting for network or model output;
- if the database remains locked beyond the short busy timeout, keep the record in memory and continue the model turn;
- flush deferred in-memory records only at safe lifecycle points;
- close the database on session shutdown when practical.

The synchronous Node SQLite API must not be used on high-frequency streaming events.

## 10. Storage impact

Expected record size must be benchmarked, but the design target is less than 1 KiB per provider attempt excluding indexes.

At 1,000 attempts per month, detailed data should remain in the low single-digit megabyte range. The default 32 MiB soft limit provides ample headroom without allowing unbounded growth.

Do not promise exact disk usage until measured with the final schema and representative records.

## 11. Retention and cleanup

Cleanup requires no timer or daemon.

Run cleanup:

- at most once per UTC day during `session_start`;
- after a benchmark completes;
- after retention settings change;
- when the database exceeds its soft size limit.

Cleanup transaction:

1. update daily rollups for detailed rows that will expire;
2. delete `provider_attempts` older than `retentionDays`;
3. delete `daily_rollups` older than `rollupRetentionDays`;
4. delete incomplete benchmark runs older than 7 days;
5. run `PRAGMA incremental_vacuum` only when enough pages are reclaimable;
6. checkpoint the WAL outside an active model request.

If the database remains above `maxDatabaseBytes`:

1. shorten detailed history first;
2. preserve the most recent 7 days where possible;
3. preserve daily rollups longer than detailed rows;
4. never delete Pi settings, sessions, credentials, or project files.

## 12. Wipes and exports

Commands:

```text
/zai-data status
/zai-data clear-project
/zai-data clear-details
/zai-data clear-benchmarks
/zai-data clear-all
/zai-data export-json <path>
/zai-data export-csv <path>
/zai-data vacuum
```

Behavior:

- `clear-project`: remove local records matching the current project hash;
- `clear-details`: retain daily rollups but delete detailed attempt rows;
- `clear-benchmarks`: delete benchmark runs and observations;
- `clear-all`: delete the SQLite database and its WAL/SHM companions after confirmation;
- exports are explicit and local;
- no export contains raw paths, prompts, code, tool payloads, secrets, or authorization headers.

## 13. Anonymous aggregate payload

Level 2 uploads one compact aggregate object, for example:

```json
{
  "schema": 1,
  "periodHours": 24,
  "extensionVersion": "0.2.0",
  "piVersionMajorMinor": "0.80",
  "nodeMajor": 22,
  "osFamily": "linux",
  "provider": "zai",
  "model": "glm-5.2",
  "thinkingLevel": "high",
  "promptMode": "observe",
  "affinityMode": "off",
  "turns": 37,
  "attempts": 39,
  "errorsByCategory": {
    "http_429": 1,
    "stream_interrupted": 1
  },
  "inputTokenBucket": "1m-5m",
  "cacheRatioBucket": "80-90",
  "ttftP50BucketMs": "1000-2000",
  "ttftP95BucketMs": "5000-10000",
  "pluginOverheadP95BucketMs": "0-5"
}
```

Use buckets instead of exact values where exactness is not required. Do not send timestamps more precise than the aggregation period.

Do not include:

- installation ID;
- project ID;
- session/query/request ID;
- full Pi patch version unless needed for a confirmed regression investigation;
- hostname;
- IP address;
- locale;
- timezone;
- country;
- repository metadata;
- provider error text;
- custom model or endpoint URL.

## 14. Minimal central ingestion

Initial shared telemetry should use:

```text
pi-zai extension
  -> one HTTPS POST after session end
  -> Cloudflare Worker validation endpoint
  -> Workers Analytics Engine
```

Use Workers Analytics Engine for anonymous aggregate telemetry because the data is analytical and append-oriented. Do not introduce D1 for the first aggregate-only version.

The Worker must:

- require the exact current schema;
- reject unknown fields;
- enforce a small body limit;
- rate-limit submissions;
- avoid logging request bodies;
- not store IP addresses, user agents, authorization headers, or raw request metadata in application storage;
- return quickly;
- never be required for extension operation.

Add D1 only if later requirements need stateful records, such as:

- diagnostic upload IDs;
- explicit server-side deletion requests;
- consent receipts;
- benchmark submission status;
- release experiment assignments.

D1 is not needed for simple anonymous aggregate counters.

## 15. Server-side reporting safeguards

Even anonymous aggregate telemetry can expose rare combinations.

Reporting rules:

- do not display a bucket publicly until it contains at least 10 submissions;
- merge rare OS/model/version combinations into `other`;
- do not expose raw ingestion rows;
- publish only aggregate statistics;
- cap retention of raw aggregate points;
- document the payload schema and retention publicly;
- version the telemetry schema independently from the package version.

## 16. Implementation sequence

### Step 1: local SQLite only

- add `StorageAdapter` interface;
- implement `MemoryStorage`;
- implement `NodeSqliteStorage`;
- create migrations and schema tests;
- move usage/cache commands to SQL queries;
- implement retention, size checks, wipes, and exports;
- keep remote telemetry absent.

### Step 2: prove local overhead

Benchmark:

- database disabled;
- memory-only;
- SQLite enabled;
- one and multiple concurrent Pi processes;
- SSD and slower filesystem;
- clean, locked, corrupt, and read-only database conditions.

Acceptance:

- no additional provider or model request;
- no writes during stream-delta events;
- less than 5 ms p95 storage overhead at attempt completion under normal local conditions;
- lock or corruption never blocks the model turn;
- database remains within the configured size policy.

### Step 3: define public telemetry contract

Before implementing uploads:

- publish the exact Level 2 JSON schema;
- publish examples of included and excluded data;
- add `/zai-telemetry preview`;
- add tests proving forbidden fields cannot serialize;
- add consent and disable behavior;
- decide central retention.

### Step 4: optional aggregate ingestion

- deploy a minimal Cloudflare Worker;
- validate and bucket payloads;
- write aggregate points to Workers Analytics Engine;
- add at-most-once daily submission after session end;
- fail silently except for `/zai-telemetry status`;
- do not retry in the model request path.

### Step 5: use telemetry only for evidence-based defaults

Evaluate by extension and Pi version:

- cache-ratio distributions;
- new-input-token distributions;
- TTFT distributions;
- transport-error categories;
- retry rates;
- plugin-overhead buckets;
- safe-mode and affinity experiment outcomes.

Never change a default solely because one installation or one benchmark improved.

## 17. Definition of done

The storage and telemetry design is complete when:

1. Local usage and cache history use one bounded SQLite database.
2. The extension works fully with remote telemetry disabled.
3. Level 1 local-only is the default.
4. Level 2 requires explicit opt-in and uploads only daily aggregates.
5. Level 3 requires a preview and one-time confirmation.
6. No prompt, code, tool output, path, credential, or raw identifier is stored remotely.
7. Database failures degrade to memory-only mode.
8. Wipes and exports are explicit and tested.
9. Central ingestion is optional and never part of the model request path.
10. Shared telemetry is used to improve extension compatibility and defaults, not to train or modify GLM.

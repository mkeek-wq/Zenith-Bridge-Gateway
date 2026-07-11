# H6.2 Filesystem Dependency Fixture Specification v0.1

**Date:** 11 Jul 2026  
**Status:** Discovery Specification  
**Phase:** H6.2.1  
**Purpose:** Define the controlled source-code fixtures required to validate future filesystem dependency parsers before repository-wide use.

---

# 1. Mission

The H6.2 dependency architecture requires measurable parser validation.

Before a new parser is allowed to scan the production repository, it must first prove that it can correctly identify known filesystem relationships in a controlled fixture set.

The fixture library exists to provide:

- deterministic test inputs;
- known expected outputs;
- confidence expectations;
- false-positive protection;
- regression protection;
- parser comparison evidence.

The fixture library is not production code.

It is a controlled validation corpus.

---

# 2. Why Fixtures Are Required

Repository discovery has shown that filesystem paths appear in many forms, including:

- direct literals;
- `path.join(...)`;
- `path.resolve(...)`;
- file-local constants;
- nested path variables;
- template literals;
- dynamic filenames;
- directory references;
- helper functions;
- inline filesystem calls;
- asynchronous filesystem calls.

A parser can appear successful while still missing important patterns.

Fixtures prevent success from being judged by impression.

Each parser version must be evaluated against the same stable corpus.

---

# 3. Fixture Location

Proposed fixture root:

```text
artifacts/api-server/src/scripts/__fixtures__/filesystem-dependency/
```

Every fixture is intentionally small.

Each fixture demonstrates exactly one discovery problem.

Complex production scripts should never become parser tests.

---

# 4. Fixture Philosophy

Fixtures are designed to answer one question:

> Can the parser correctly discover this dependency?

Nothing more.

A fixture should never contain unnecessary business logic.

Each fixture isolates a single filesystem pattern.

If a parser fails, the exact capability that failed is immediately obvious.

---

# 5. Expected Result Contract

Every fixture must include a matching expected-result file.

Example:

```text
fixture-path-join.ts
fixture-path-join.expected.json
```

The expected file defines:

- reads
- writes
- ignored paths
- unresolved paths
- confidence expectation

The parser output is compared directly against this expected result.

This allows automatic regression testing.

---

# 6. Confidence Levels

Each discovered dependency should include a confidence classification.

| Confidence | Meaning |
|------------|---------|
| High | Explicit filesystem dependency. |
| Medium | Derived through constants or helper variables. |
| Low | Dynamic or partially inferred relationship. |
| Unknown | Relationship detected but unresolved. |

Confidence is metadata.

It never determines correctness.

It communicates certainty to Papa and Brainy.

---

# 7. Fixture Categories

The initial fixture library should cover:

- Direct reads
- Direct writes
- path.join()
- path.resolve()
- Constant expansion
- Nested variables
- Template literals
- Dynamic filenames
- Directory reads
- Helper wrappers
- Async filesystem APIs
- Combined read/write workflows
- Ambiguous cases
- Invalid cases
- False-positive protection

Every new parser capability should first receive its own fixture before being used against the repository.

---

# 8. Direct Read Fixture

Purpose:

Verify that explicit read operations are discovered.

Fixture:

```ts
const data = fs.readFileSync(
  "data/replay/replay-quality-summary-v0.1.json",
  "utf8"
);
```

Expected:

```text
Reads:
  data/replay/replay-quality-summary-v0.1.json

Writes:
  none

Confidence:
  High
```

---

# 9. Direct Write Fixture

Purpose:

Verify direct output detection.

Fixture:

```ts
fs.writeFileSync(
  "data/replay/output/example.json",
  JSON.stringify(result)
);
```

Expected:

```text
Writes:
  data/replay/output/example.json

Reads:
  none

Confidence:
  High
```

---

# 10. path.join Fixture

Purpose:

Verify joined paths are reconstructed.

Fixture:

```ts
const output = path.join(
  apiRoot,
  "data/replay",
  "replay-quality-summary-v0.1.json"
);

fs.writeFileSync(output, "{}");
```

Expected:

```text
Writes:
  data/replay/replay-quality-summary-v0.1.json

Confidence:
  High
```

---

# 11. path.resolve Fixture

Purpose:

Verify path.resolve() reconstruction.

Fixture:

```ts
const file = path.resolve(
  ROOT,
  "data/replay/replay-case-registry-v0.2.json"
);

fs.readFileSync(file);
```

Expected:

```text
Reads:
  data/replay/replay-case-registry-v0.2.json

Confidence:
  High
```

---

# 12. Constant Expansion Fixture

Purpose:

Verify constants are expanded before dependency extraction.

Fixture:

```ts
const REPLAY_DIR = "data/replay";

const output =
  `${REPLAY_DIR}/replay-confidence-engine-v0.1.json`;

fs.writeFileSync(output, "{}");
```

Expected:

```text
Writes:
  data/replay/replay-confidence-engine-v0.1.json

Confidence:
  High
```

---

# 13. Nested Constant Fixture

Purpose:

Verify multiple constants resolve correctly.

Fixture:

```ts
const ROOT = "data";
const DOMAIN = "replay";
const FILE = "replay-quality-summary-v0.1.json";

const pathName =
`${ROOT}/${DOMAIN}/${FILE}`;
```

Expected:

```text
Reads:
  data/replay/replay-quality-summary-v0.1.json

Confidence:
  Medium
```

---

# 14. Template Literal Fixture

Purpose:

Verify template literal expansion.

Fixture:

```ts
const replayRunId = "run-001";

const output =
`data/replay/run-manifests/${replayRunId}.json`;
```

Expected:

```text
Writes:
  data/replay/run-manifests/${variable}.json

Confidence:
  Medium
```

---

# 15. Directory Fixture

Purpose:

Verify directory dependencies are recorded.

Fixture:

```ts
const files =
fs.readdirSync("data/replay/wave-1");
```

Expected:

```text
Reads:
  data/replay/wave-1/

Dependency Type:
  Directory

Confidence:
  High
```

---

# 16. Helper Wrapper Fixture

Purpose:

Verify that helper functions do not hide filesystem dependencies.

Fixture:

```ts
function readJson(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const quality = readJson(
  "data/replay/replay-quality-summary-v0.1.json"
);
```

Expected:

```text
Reads:
  data/replay/replay-quality-summary-v0.1.json

Confidence:
  High
```

---

# 17. Async Filesystem Fixture

Purpose:

Verify asynchronous filesystem APIs.

Fixture:

```ts
await fs.promises.writeFile(
  "data/replay/output/report.json",
  "{}"
);
```

Expected:

```text
Writes:
  data/replay/output/report.json

Confidence:
  High
```

---

# 18. Combined Read / Write Fixture

Purpose:

Verify that a single script may both consume and produce packages.

Fixture:

```ts
const source =
fs.readFileSync(
  "data/replay/replay-quality-summary-v0.1.json",
  "utf8"
);

fs.writeFileSync(
  "data/replay/replay-dashboard-package-v0.1.json",
  source
);
```

Expected:

```text
Reads:
  data/replay/replay-quality-summary-v0.1.json

Writes:
  data/replay/replay-dashboard-package-v0.1.json

Confidence:
  High
```

---

# 19. Multiple Dependency Fixture

Purpose:

Verify that multiple independent reads are all detected.

Fixture:

```ts
readJson("data/replay/replay-quality-summary-v0.1.json");
readJson("data/replay/replay-analogue-summary-v0.1.json");
readJson("data/replay/replay-explanation-summary-v0.1.json");
```

Expected:

```text
Reads:

- replay-quality-summary
- replay-analogue-summary
- replay-explanation-summary

Confidence:
  High
```

---

# 20. Unresolved Variable Fixture

Purpose:

Verify graceful handling of unknown values.

Fixture:

```ts
const filename = process.argv[2];

fs.readFileSync(
  `data/replay/${filename}`
);
```

Expected:

```text
Reads:
  data/replay/${unknown}

Confidence:
  Unknown

Status:
  Requires runtime resolution
```

The parser should record the dependency rather than silently ignoring it.

---

# 21. False Positive Fixture

Purpose:

Ensure comments and documentation do not generate dependencies.

Fixture:

```ts
// data/replay/replay-quality-summary-v0.1.json

const text =
"Example: data/replay/example.json";
```

Expected:

```text
Reads:
  none

Writes:
  none
```

The parser should distinguish executable code from ordinary text.

---

# 22. Invalid Filesystem Fixture

Purpose:

Verify invalid paths are reported correctly.

Fixture:

```ts
fs.readFileSync(
  "data/replay/does-not-exist.json"
);
```

Expected:

```text
Reads:
  data/replay/does-not-exist.json

Status:
  Referenced Missing

Confidence:
  High
```

This allows discovery reports to identify broken dependencies without preventing registry generation.

---

# 23. Fixture Evolution

The fixture library should expand whenever a new filesystem pattern is discovered in the repository.

The recommended workflow is:

```text
New repository pattern discovered
            │
            ▼
Create minimal fixture
            │
            ▼
Define expected output
            │
            ▼
Parser updated
            │
            ▼
Fixture passes
            │
            ▼
Repository scan repeated
```

The production repository should never become the first place where a new parser capability is tested.

---

# 24. Replay Acceptance Suite

Before a parser may be used against the production repository, it should successfully discover the dependency chain represented by the Papa Replay Dashboard.

Minimum chain:

```text
Replay Quality Summary
            │
            ▼
Replay Analogue Summary
            │
            ▼
Replay Explanation Summary
            │
            ▼
Papa Replay Dashboard Package
```

The parser should correctly identify:

- producers;
- consumers;
- upstream scripts;
- downstream scripts;
- package lineage;
- dependency direction.

This chain represents a real production workflow and serves as the primary acceptance benchmark.

---

# 25. Benchmark Metrics

Each parser version should be evaluated using objective metrics.

Suggested measurements include:

| Metric | Purpose |
|---------|---------|
| Precision | Percentage of discovered dependencies that are correct. |
| Recall | Percentage of known dependencies successfully detected. |
| False Positives | Incorrect dependencies reported. |
| False Negatives | Existing dependencies that were missed. |
| Unknown Dependencies | Dependencies requiring runtime resolution. |
| Parser Runtime | Execution time of repository scan. |

These metrics should accompany every parser revision.

---

# 26. Governance

Parser improvements follow normal Village governance.

```text
Repository Discovery
        │
        ▼
Brainy
Design parser improvement
        │
        ▼
Fixture Suite
Controlled validation
        │
        ▼
Shadow
Independent verification
        │
        ▼
Papa
Approval decision
        │
        ▼
Production Dependency Registry
```

No parser should be promoted directly into production without passing the fixture suite.

---

# 27. Versioning

The fixture library should evolve independently from the parser itself.

Example:

```text
filesystem-fixtures-v0.1

parser-v0.1

parser-v0.2

parser-v0.3
```

A newer parser must remain compatible with older fixture versions unless a deliberate governance decision updates the specification.

This preserves regression evidence across future parser iterations.

---

# 28. Success Criteria

H6.2.1 is considered complete when:

- a controlled fixture library exists;
- every fixture has an expected-result contract;
- parser outputs are automatically comparable against expectations;
- Replay acceptance cases pass successfully;
- parser confidence metadata is generated consistently;
- regression testing becomes repeatable.

At that point, repository-wide dependency discovery can evolve with significantly lower implementation risk.

---

# Summary

The Filesystem Dependency Fixture Specification establishes a controlled validation framework for future dependency discovery.

Rather than relying on ad hoc repository scans, parser capabilities are introduced through deterministic fixtures, expected outputs and governed acceptance testing.

This transforms dependency discovery from a best-effort heuristic into an evidence-driven engineering discipline, providing Brainy, Shadow and Papa with a reliable foundation for future orchestration and runtime evolution.

---

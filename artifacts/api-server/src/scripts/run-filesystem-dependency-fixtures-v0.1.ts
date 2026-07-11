import fs from "fs";
import path from "path";

import {
  discoverFilesystemReferences,
  type FilesystemReference,
} from "../lib/repository-discovery/index.js";

type ExpectedReference = {
  target: string;
  confidence: FilesystemReference["confidence"];
  parser: FilesystemReference["parser"];
};

type ExpectedFixtureResult = {
  fixture: string;
  reads: ExpectedReference[];
  writes: ExpectedReference[];
  ignored_paths: string[];
  unresolved_paths: string[];
};

type ActualFixtureResult = ExpectedFixtureResult;

const ROOT = process.cwd();

const FIXTURE_DIR = path.join(
  ROOT,
  "src/scripts/__fixtures__/filesystem-dependency"
);

function sortReferences(
  references: ExpectedReference[]
): ExpectedReference[] {
  return [...references].sort((a, b) =>
    a.target.localeCompare(b.target)
  );
}

function classifyReferences(
  source: string,
  references: FilesystemReference[]
): {
  reads: ExpectedReference[];
  writes: ExpectedReference[];
} {
  const writes: ExpectedReference[] = [];
  const reads: ExpectedReference[] = [];

  for (const reference of references) {
    const escapedTarget = reference.target.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const writePattern = new RegExp(
      `writeFileSync\\([^\\n]*${escapedTarget}`
    );

    const outputConstantPattern = new RegExp(
      `(OUTPUT|OUTPUT_PATH|OUTPUT_FILE|outPath|outputPath)[^\\n]*${escapedTarget}`
    );

    const normalizedReference: ExpectedReference = {
      target: reference.target,
      confidence: reference.confidence,
      parser: reference.parser,
    };

    if (
      reference.operation === "write" ||
      writePattern.test(source) ||
      outputConstantPattern.test(source)
    ) {
      writes.push(normalizedReference);
    } else {
      reads.push(normalizedReference);
    }
  }

  return {
    reads: sortReferences(reads),
    writes: sortReferences(writes),
  };
}

function buildActualResult(
  fixtureName: string,
  source: string
): ActualFixtureResult {
  const references = discoverFilesystemReferences(source);
  const classified = classifyReferences(source, references);

  return {
    fixture: fixtureName,
    reads: classified.reads,
    writes: classified.writes,
    ignored_paths: [],
    unresolved_paths: [],
  };
}

function normalizeResult(
  result: ExpectedFixtureResult
): ExpectedFixtureResult {
  return {
    fixture: result.fixture,
    reads: sortReferences(result.reads),
    writes: sortReferences(result.writes),
    ignored_paths: [...result.ignored_paths].sort(),
    unresolved_paths: [...result.unresolved_paths].sort(),
  };
}

function loadExpectedResult(
  expectedPath: string
): ExpectedFixtureResult {
  return JSON.parse(
    fs.readFileSync(expectedPath, "utf8")
  ) as ExpectedFixtureResult;
}

if (!fs.existsSync(FIXTURE_DIR)) {
  throw new Error(
    `Fixture directory does not exist: ${FIXTURE_DIR}`
  );
}

const fixtureFiles = fs
  .readdirSync(FIXTURE_DIR)
  .filter(
    (fileName) =>
      fileName.endsWith(".ts") &&
      fileName.startsWith("fixture-")
  )
  .sort();

let passed = 0;
let failed = 0;

for (const fixtureName of fixtureFiles) {
  const fixturePath = path.join(FIXTURE_DIR, fixtureName);

  const expectedPath = path.join(
    FIXTURE_DIR,
    fixtureName.replace(/\.ts$/, ".expected.json")
  );

  if (!fs.existsSync(expectedPath)) {
    failed += 1;

    console.error({
      fixture: fixtureName,
      status: "FAIL",
      reason: "missing_expected_result",
      expected_path: expectedPath,
    });

    continue;
  }

  const source = fs.readFileSync(fixturePath, "utf8");

  const expected = normalizeResult(
    loadExpectedResult(expectedPath)
  );

  const actual = normalizeResult(
    buildActualResult(fixtureName, source)
  );

  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed += 1;

    console.log({
      fixture: fixtureName,
      status: "PASS",
    });
  } else {
    failed += 1;

    console.error({
      fixture: fixtureName,
      status: "FAIL",
      expected,
      actual,
    });
  }
}

const summary = {
  fixture_runner: "filesystem-dependency-fixtures-v0.1",
  fixture_directory:
    "src/scripts/__fixtures__/filesystem-dependency",
  fixtures_discovered: fixtureFiles.length,
  passed,
  failed,
  success: failed === 0,
};

console.log(summary);

if (failed > 0) {
  process.exitCode = 1;
}

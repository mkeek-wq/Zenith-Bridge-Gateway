export type FilesystemReferenceOperation =
  | "read"
  | "write"
  | "unknown";

export type FilesystemReference = {
  target: string;
  evidence: string;
  parser:
    | "literal-data-intelligence-v0.1"
    | "literal-data-path-v0.2"
    | "path-join-data-path-v0.1";
  confidence: "high";
  operation: FilesystemReferenceOperation;
};

function uniqueReferences(
  references: FilesystemReference[]
): FilesystemReference[] {
  const byKey = new Map<string, FilesystemReference>();

  for (const reference of references) {
    const key = [
      reference.target,
      reference.operation,
      reference.parser,
    ].join("|");

    byKey.set(key, reference);
  }

  return [...byKey.values()].sort((a, b) =>
    a.target.localeCompare(b.target)
  );
}

function inferLiteralOperation(
  source: string,
  target: string
): FilesystemReferenceOperation {
  const escapedTarget = target.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const writePattern = new RegExp(
    `writeFileSync\\([^\\n]*${escapedTarget}`
  );

  const outputConstantPattern = new RegExp(
    `(OUTPUT|OUTPUT_PATH|OUTPUT_FILE|outPath|outputPath)[^\\n]*${escapedTarget}`
  );

  if (
    writePattern.test(source) ||
    outputConstantPattern.test(source)
  ) {
    return "write";
  }

  return "read";
}

function discoverLiteralReferences(
  source: string
): FilesystemReference[] {
  const matches =
    source.match(
      /data\/(?:intelligence|replay)\/[^"'`\s,)]+/g
    ) ?? [];

  const targets = [
    ...new Set(
      matches.map((match) =>
        match.replace(/[;,.]+$/, "")
      )
    ),
  ].sort();

  return targets.map((target) => ({
    target,
    evidence: target,
    parser: target.startsWith("data/replay/")
      ? "literal-data-path-v0.2"
      : "literal-data-intelligence-v0.1",
    confidence: "high",
    operation: inferLiteralOperation(source, target),
  }));
}

function discoverPathJoinReferences(
  source: string
): FilesystemReference[] {
  const references: FilesystemReference[] = [];

  const assignmentPattern =
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*path\.join\s*\(([\s\S]*?)\)\s*;/g;

  for (const match of source.matchAll(assignmentPattern)) {
    const variableName = match[1];
    const argumentsSource = match[2];
    const evidence = match[0];

    const stringSegments = [
      ...argumentsSource.matchAll(
        /["'`]([^"'`]+)["'`]/g
      ),
    ].map((segmentMatch) => segmentMatch[1]);

    const dataIndex = stringSegments.findIndex(
      (segment) =>
        segment === "data" ||
        segment.startsWith("data/")
    );

    if (dataIndex < 0) continue;

    const target = stringSegments
      .slice(dataIndex)
      .join("/")
      .replace(/\/+/g, "/");

    if (
      !target.startsWith("data/intelligence/") &&
      !target.startsWith("data/replay/")
    ) {
      continue;
    }

    const escapedVariable = variableName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const writePattern = new RegExp(
      `writeFileSync\\(\\s*${escapedVariable}\\b`
    );

    const readPattern = new RegExp(
      `readFileSync\\(\\s*${escapedVariable}\\b`
    );

    let operation: FilesystemReferenceOperation = "unknown";

    if (writePattern.test(source)) {
      operation = "write";
    } else if (readPattern.test(source)) {
      operation = "read";
    }

    references.push({
      target,
      evidence,
      parser: "path-join-data-path-v0.1",
      confidence: "high",
      operation,
    });
  }

  return references;
}

export function discoverFilesystemReferences(
  source: string
): FilesystemReference[] {
  return uniqueReferences([
    ...discoverLiteralReferences(source),
    ...discoverPathJoinReferences(source),
  ]);
}

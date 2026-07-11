export type FilesystemReference = {
  target: string;
  evidence: string;
  parser:
    | "literal-data-intelligence-v0.1"
    | "literal-data-path-v0.2";
  confidence: "high";
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function discoverFilesystemReferences(
  source: string
): FilesystemReference[] {
  const matches =
    source.match(/data\/(?:intelligence|replay)\/[^"'`\s,)]+/g) ?? [];

  const targets = unique(
    matches.map((match) => match.replace(/[;,.]+$/, ""))
  );

  return targets.map((target) => ({
    target,
    evidence: target,
    parser: target.startsWith("data/replay/")
      ? "literal-data-path-v0.2"
      : "literal-data-intelligence-v0.1",
    confidence: "high",
  }));
}

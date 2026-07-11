export type FilesystemReference = {
  target: string;
  evidence: string;
  parser: "literal-data-intelligence-v0.1";
  confidence: "high";
};

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function discoverFilesystemReferences(
  source: string
): FilesystemReference[] {
  const matches =
    source.match(/data\/intelligence\/[^"'`\s,)]+/g) ?? [];

  const targets = unique(
    matches.map((match) => match.replace(/[;,.]+$/, ""))
  );

  return targets.map((target) => ({
    target,
    evidence: target,
    parser: "literal-data-intelligence-v0.1",
    confidence: "high",
  }));
}

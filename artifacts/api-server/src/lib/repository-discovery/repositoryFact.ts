export type RepositoryFactOperation =
  | "read"
  | "write"
  | "unknown";

export type RepositoryFactConfidence =
  | "high"
  | "medium"
  | "low"
  | "unresolved";

export type RepositoryFact = {
  source_artifact: string;
  target_artifact: string;
  operation: RepositoryFactOperation;
  confidence: RepositoryFactConfidence;
  discovery_parser: string;
  evidence: string;
};

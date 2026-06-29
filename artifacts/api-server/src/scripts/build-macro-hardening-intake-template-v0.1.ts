import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const OUTPUT_PATH =
  "data/intelligence/macro-hardening-intake-template-v0.1.json";

const template = {
  template_version: "macro-hardening-intake-template-v0.1",
  generated_at: new Date().toISOString(),
  doctrine:
    "New macro indicators must be source-governed, domain-mapped, mechanism-linked, and lineage-ready before controlled ingestion.",
  required_fields: [
    "indicator_id",
    "indicator_name",
    "domain",
    "macro_category",
    "source_authority",
    "source_url_or_reference",
    "frequency",
    "period_coverage",
    "mechanisms_supported",
    "replay_cases_supported",
    "rationale",
    "lineage_status",
    "ingestion_status",
  ],
  allowed_ingestion_statuses: [
    "candidate_not_ingested",
    "dry_run_ready",
    "staged",
    "promoted",
    "rejected",
  ],
  allowed_lineage_statuses: [
    "source_identified",
    "source_verified",
    "lineage_complete",
    "lineage_incomplete",
  ],
  blank_record: {
    indicator_id: "",
    indicator_name: "",
    domain: "",
    macro_category: "",
    source_authority: "",
    source_url_or_reference: "",
    frequency: "",
    period_coverage: "",
    mechanisms_supported: [],
    replay_cases_supported: [],
    rationale: "",
    lineage_status: "source_identified",
    ingestion_status: "candidate_not_ingested",
  },
};

fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_PATH)), { recursive: true });
fs.writeFileSync(path.join(ROOT, OUTPUT_PATH), JSON.stringify(template, null, 2));

console.log({
  template_version: template.template_version,
  output: OUTPUT_PATH,
});

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const DECISION_PATH =
  "data/intelligence/sector-manual-promotion-decision-v0.1.json";

const REGISTRY_PATH =
  "data/intelligence/sector-macro-registry-v0.1.json";

const OUTPUT_PATH =
  "data/intelligence/sector-indicator-promotion-executor-v0.1.json";

function main() {
  const decisionsData = JSON.parse(
    fs.readFileSync(path.join(ROOT, DECISION_PATH), "utf8")
  );

  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, REGISTRY_PATH), "utf8")
  );

  const approvedIds = new Set(
    (decisionsData.decisions ?? [])
      .filter((d: any) => d.manual_decision === "approve")
      .map((d: any) => d.indicator_id)
  );

  const promoted: any[] = [];
  const notPromoted: any[] = [];

  const updatedIndicators = (registry.indicators ?? []).map((indicator: any) => {
    if (approvedIds.has(indicator.indicator_id)) {
      const updated = {
        ...indicator,
        lineage_status: "source_verified",
        ingestion_status: "promoted",
        promoted_at: new Date().toISOString(),
        promotion_basis:
          "manual approval after duplicate review and controlled staging",
      };

      promoted.push({
        indicator_id: updated.indicator_id,
        indicator_name: updated.indicator_name,
        domain: updated.domain,
        ingestion_status: updated.ingestion_status,
      });

      return updated;
    }

    notPromoted.push({
      indicator_id: indicator.indicator_id,
      indicator_name: indicator.indicator_name,
      domain: indicator.domain,
      ingestion_status: indicator.ingestion_status,
    });

    return indicator;
  });

  const updatedRegistry = {
    ...registry,
    updated_at: new Date().toISOString(),
    promotion_run: {
      executor_version: "sector-indicator-promotion-executor-v0.1",
      decision_source: DECISION_PATH,
      promoted_count: promoted.length,
      not_promoted_count: notPromoted.length,
    },
    indicators: updatedIndicators,
  };

  fs.writeFileSync(
    path.join(ROOT, REGISTRY_PATH),
    JSON.stringify(updatedRegistry, null, 2)
  );

  const output = {
    executor_version: "sector-indicator-promotion-executor-v0.1",
    generated_at: new Date().toISOString(),
    decision_source: DECISION_PATH,
    registry_updated: REGISTRY_PATH,
    promoted_count: promoted.length,
    not_promoted_count: notPromoted.length,
    promoted,
    not_promoted: notPromoted,
    governance_note:
      "Promotion executor only promotes indicators explicitly marked approve in the manual decision file.",
  };

  fs.writeFileSync(
    path.join(ROOT, OUTPUT_PATH),
    JSON.stringify(output, null, 2)
  );

  console.log({
    executor_version: output.executor_version,
    promoted_count: output.promoted_count,
    not_promoted_count: output.not_promoted_count,
    registry_updated: REGISTRY_PATH,
    output: OUTPUT_PATH,
  });

  for (const item of promoted) {
    console.log(`${item.indicator_id} | promoted`);
  }
}

main();

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const timeline =
  readJsonSafe(path.join(ROOT, "data/intelligence/case-timeline-engine-v0.1.json")) || {};

const timelineItems: any[] = timeline.timeline_items || [];

const mechanismIds = Array.from(
  new Set(
    timelineItems.flatMap((item) =>
      (item.mechanisms || []).map((m: any) => m.mechanism_id)
    )
  )
);

const mechanismTrends = mechanismIds.map((mechanismId) => {
  const observations = timelineItems
    .map((item) => {
      const mechanism = (item.mechanisms || []).find((m: any) => m.mechanism_id === mechanismId);
      if (!mechanism) return null;

      return {
        snapshot_id: item.snapshot_id,
        created_at: item.created_at,
        mechanism_id: mechanism.mechanism_id,
        mechanism_name: mechanism.mechanism_name,
        confidence_score: Number(mechanism.adjusted_confidence_score ?? 0),
        replay_support_score: Number(mechanism.replay_support_score ?? 0),
        promotion_score: Number(mechanism.promotion_score ?? 0),
        promotion_status: mechanism.promotion_status,
        lifecycle_status: mechanism.lifecycle_status,
      };
    })
    .filter(Boolean) as any[];

  const first = observations[0] || null;
  const latest = observations[observations.length - 1] || null;

  const confidenceDelta =
    first && latest
      ? Number((latest.confidence_score - first.confidence_score).toFixed(3))
      : 0;

  const promotionDelta =
    first && latest
      ? Number((latest.promotion_score - first.promotion_score).toFixed(3))
      : 0;

  return {
    mechanism_id: mechanismId,
    mechanism_name: latest?.mechanism_name || first?.mechanism_name || "Unknown Mechanism",
    observations: observations.length,
    first_observation_at: first?.created_at || null,
    latest_observation_at: latest?.created_at || null,
    latest_confidence_score: latest?.confidence_score ?? null,
    confidence_delta_since_first: confidenceDelta,
    latest_replay_support_score: latest?.replay_support_score ?? null,
    latest_promotion_score: latest?.promotion_score ?? null,
    promotion_delta_since_first: promotionDelta,
    latest_promotion_status: latest?.promotion_status || null,
    latest_lifecycle_status: latest?.lifecycle_status || null,
    trend_status:
      confidenceDelta > 0.03 || promotionDelta > 0.03
        ? "strengthening"
        : confidenceDelta < -0.03 || promotionDelta < -0.03
          ? "weakening"
          : "stable",
    observations_detail: observations,
  };
});

const output = {
  registry_version: "mechanism-trend-engine-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    trend_is_change_tracking_not_validation: true,
    mechanisms_remain_challengeable: true,
    evidence_remains_primary: true,
  },
  inputs: {
    timeline_items: timelineItems.length,
    mechanisms_detected: mechanismIds.length,
  },
  summary: {
    mechanism_trends_created: mechanismTrends.length,
    strengthening: mechanismTrends.filter((m) => m.trend_status === "strengthening").length,
    weakening: mechanismTrends.filter((m) => m.trend_status === "weakening").length,
    stable: mechanismTrends.filter((m) => m.trend_status === "stable").length,
  },
  mechanism_trends: mechanismTrends,
};

ensureDir(path.join(ROOT, "data/intelligence"));

fs.writeFileSync(
  path.join(ROOT, "data/intelligence/mechanism-trend-engine-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  engine_version: output.registry_version,
  inputs: output.inputs,
  summary: output.summary,
  output: "data/intelligence/mechanism-trend-engine-v0.1.json",
});

console.table(
  mechanismTrends.map((m) => ({
    mechanism_id: m.mechanism_id,
    mechanism: m.mechanism_name,
    latest_confidence: m.latest_confidence_score,
    confidence_delta: m.confidence_delta_since_first,
    promotion: m.latest_promotion_score,
    promotion_delta: m.promotion_delta_since_first,
    trend: m.trend_status,
  }))
);

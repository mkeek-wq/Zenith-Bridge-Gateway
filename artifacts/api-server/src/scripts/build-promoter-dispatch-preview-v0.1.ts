import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function readJson(rel: string) {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, rel), "utf8")
  );
}

const registry = readJson(
  "data/intelligence/smurf-registry-v0.1.json"
);

const approval = readJson(
  "data/ingestion/hungry-smurf-human-approval-v0.1.json"
);

const troll = readJson(
  "data/intelligence/sysadmin-troll-bridge-audit-v0.1.json"
);

const promotion = readJson(
  "data/ingestion/hungry-smurf-promotion-package-v0.2.json"
);

const ready = approval.human_decision === "APPROVED";
const trollOk = troll.violation_count === 0;

const wake = registry.smurfs
  .filter((s: any) => s.wake_after_promotion)
  .map((s: any) => ({
    smurf_id: s.smurf_id,
    name: s.name,
    dependencies: s.dependencies,
    category: s.category,
    runtime: s.scaling.expected_runtime_seconds
  }));

function stageFor(smurfId: string) {
  if (smurfId === "COVERAGE") return 1;
  if (smurfId === "SIGNAL" || smurfId === "GRAPH") return 2;
  if (smurfId === "REPLAY") return 3;
  if (smurfId === "WORKBENCH") return 4;
  return 99;
}

wake.sort((a: any, b: any) => {
  const stageDiff = stageFor(a.smurf_id) - stageFor(b.smurf_id);
  if (stageDiff !== 0) return stageDiff;
  return a.smurf_id.localeCompare(b.smurf_id);
});

const dispatch = wake.map((s: any) => ({
  stage: stageFor(s.smurf_id),
  ...s,
  parallel_group: `stage_${stageFor(s.smurf_id)}`,
  status:
    ready && trollOk
      ? "READY_TO_WAKE"
      : "WAITING"
}));

const output = {
  preview_version: "promoter-dispatch-preview-v0.1",
  generated_at: new Date().toISOString(),

  promotion_allowed:
    ready &&
    trollOk &&
    promotion.decision ===
      "READY_FOR_HUMAN_APPROVAL",

  governance: {
    human_approved: ready,
    troll_guard_ok: trollOk,
    production_execution: false,
    preview_only: true
  },

  wake_count: dispatch.length,

  wake_plan: dispatch
};

const out =
  "data/intelligence/promoter-dispatch-preview-v0.1.json";

fs.writeFileSync(
  path.join(ROOT, out),
  JSON.stringify(output, null, 2)
);

console.log({
  preview_version: output.preview_version,
  wake_count: output.wake_count,
  promotion_allowed: output.promotion_allowed,
  output: out
});

dispatch.forEach((s: any) => {
  console.log(
    `stage ${s.stage}. ${s.smurf_id} | ${s.status} | parallel=${s.parallel_group} | deps=${s.dependencies.join(",") || "-"}`
  );
});

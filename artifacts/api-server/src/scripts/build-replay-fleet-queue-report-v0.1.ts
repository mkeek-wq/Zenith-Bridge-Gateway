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

const fleet =
  readJsonSafe(path.join(ROOT, "data/replay/fleet/replay-fleet-manifest-v0.1.json")) || {};

const items: any[] = fleet.fleet_items || [];

const ready = items.filter((x) => x.fleet_status === "ready_for_fleet_replay");
const blocked = items.filter((x) => x.fleet_status !== "ready_for_fleet_replay");

const lines: string[] = [];

lines.push("# Replay Fleet Queue Report v0.1");
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("## Summary");
lines.push("");
lines.push(`- Fleet items: ${items.length}`);
lines.push(`- Ready for fleet replay: ${ready.length}`);
lines.push(`- Blocked: ${blocked.length}`);
lines.push("");
lines.push("## Ready Cases");
lines.push("");

if (ready.length) {
  for (const item of ready) {
    lines.push(`- ${item.case_id} | ${item.domain} | expected mechanisms: ${item.expected_mechanisms.length}`);
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("## Blocked Cases");
lines.push("");

if (blocked.length) {
  for (const item of blocked) {
    lines.push(`- ${item.case_id} | ${item.domain} | status: ${item.fleet_status}`);
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("## Recommendation");
lines.push("");

if (ready.length >= 4 && blocked.length === 0) {
  lines.push("Fleet is ready for a controlled dry-run batch replay.");
} else if (ready.length > 0) {
  lines.push("Partial fleet is ready. Continue with small dry-run batch or add missing inputs first.");
} else {
  lines.push("Fleet is not ready. Add replay input files before batch replay.");
}

lines.push("");
lines.push("## Governance Note");
lines.push("");
lines.push("Fleet replay remains dry-run only. No production mutation, lifecycle mutation, or mechanism validation is permitted.");

const markdown = lines.join("\n");

const output = {
  registry_version: "replay-fleet-queue-report-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    queue_report_does_not_execute_replay: true,
    fleet_replay_requires_ready_inputs: true,
    dry_run_only: true
  },
  summary: {
    fleet_items: items.length,
    ready_for_fleet_replay: ready.length,
    blocked: blocked.length
  },
  markdown
};

ensureDir(path.join(ROOT, "data/replay/fleet"));
ensureDir(path.join(ROOT, "exports/replay-reports"));

fs.writeFileSync(
  path.join(ROOT, "data/replay/fleet/replay-fleet-queue-report-v0.1.json"),
  JSON.stringify(output, null, 2)
);

fs.writeFileSync(
  path.join(ROOT, "exports/replay-reports/replay-fleet-queue-report-v0.1.md"),
  markdown
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output_json: "data/replay/fleet/replay-fleet-queue-report-v0.1.json",
  output_markdown: "exports/replay-reports/replay-fleet-queue-report-v0.1.md"
});

console.log("\n--- Fleet Queue Preview ---\n");
console.log(markdown);

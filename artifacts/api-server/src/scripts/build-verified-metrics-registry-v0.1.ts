import fs from "fs";
import path from "path";

const queuePath = path.join(process.cwd(), "data/article-generator/data-request-queue-v0.1.json");
if (!fs.existsSync(queuePath)) throw new Error(`Missing input: ${queuePath}`);

const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));

const metrics = queue.requests.map((r: any, index: number) => ({
  metric_id: `VMR_${String(index + 1).padStart(3, "0")}`,
  request_id: r.request_id,
  seed_id: r.seed_id,
  country: r.country,
  metric_name: r.metric_needed,
  claim_supported: r.claim,
  preferred_source: r.preferred_source,
  value: null,
  unit: null,
  period: null,
  source_url: null,
  verified: false,
  verification_status: "pending_source_collection",
  article_ready: false,
  graph_ready: false,
  notes: "Placeholder metric record. Populate after source validation.",
}));

const output = {
  registry_version: "verified-metrics-registry-v0.1",
  generated_at: new Date().toISOString(),
  input_queue: queue.queue_version,
  seed_id: queue.seed_id,
  summary: {
    total_metrics: metrics.length,
    verified: metrics.filter((m: any) => m.verified).length,
    pending: metrics.filter((m: any) => !m.verified).length,
    graph_ready: metrics.filter((m: any) => m.graph_ready).length,
  },
  metrics,
};

const outDir = path.join(process.cwd(), "data/article-generator");
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "verified-metrics-registry-v0.1.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log({
  registry_version: output.registry_version,
  total_metrics: output.summary.total_metrics,
  verified: output.summary.verified,
  pending: output.summary.pending,
  graph_ready: output.summary.graph_ready,
  output: outPath,
});

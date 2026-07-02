import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

const configs = [
  {
    dataset_id: "SG_TOTAL_MANUFACTURING_OUTPUT_INDEX",
    name: "Singapore total manufacturing output",
    series_match: "Total Manufacturing",
  },
  {
    dataset_id: "SG_PETROLEUM_OUTPUT_INDEX",
    name: "Singapore refined petroleum products output",
    series_match: "Refined Petroleum Products",
  },
  {
    dataset_id: "SG_CHEMICALS_OUTPUT_INDEX",
    name: "Singapore chemicals and chemical products output",
    series_match: "Chemicals & Chemical Products",
  },
  {
    dataset_id: "SG_BIOMEDICAL_OUTPUT_INDEX",
    name: "Singapore pharmaceutical and biological products output",
    series_match: "Pharmaceutical & Biological Products",
  },
  {
    dataset_id: "SG_SEMICONDUCTOR_OUTPUT_INDEX",
    name: "Singapore computer, electronic and optical products output",
    series_match: "Computer, Electronic & Optical Products",
  },
  {
    dataset_id: "SG_PRECISION_ENGINEERING_OUTPUT_INDEX",
    name: "Singapore machinery and equipment output",
    series_match: "Machinery & Equipment",
  },
  {
    dataset_id: "SG_TRANSPORT_ENGINEERING_OUTPUT_INDEX",
    name: "Singapore other transport equipment output",
    series_match: "Other Transport Equipment",
  },
];

const configDir = path.join(ROOT, "data", "intelligence", "source-download-config");
fs.mkdirSync(configDir, { recursive: true });

for (const item of configs) {
  const config = {
    dataset_id: item.dataset_id,
    name: item.name,
    country: "Singapore",
    metric_type: "manufacturing_output_value",
    frequency: "annual",
    source_name: "SingStat Table Builder",
    table_id: "M354851",
    series_match: item.series_match,
    file_type: "singstat_table",
    unit: "Million Dollars",
    verification_status_after_load: "loaded_pending_review",
    notes: `Loaded from SingStat Table Builder API table M354851. Series: ${item.series_match}.`,
  };

  fs.writeFileSync(
    path.join(configDir, `${item.dataset_id}.json`),
    JSON.stringify(config, null, 2)
  );

  console.log(`Loading ${item.dataset_id}...`);
  execSync(`pnpm tsx src/scripts/load-singstat-table-v0.1.ts ${item.dataset_id}`, {
    stdio: "inherit",
  });

  execSync(`pnpm tsx src/scripts/verify-dataset-v0.1.ts ${item.dataset_id} verified`, {
    stdio: "inherit",
  });
}

execSync("pnpm tsx src/scripts/build-dataset-coverage-engine-v0.1.ts", {
  stdio: "inherit",
});

execSync("pnpm tsx src/scripts/publish-data-coverage-admin-v0.1.ts", {
  stdio: "inherit",
});

console.log({
  status: "singstat_manufacturing_registry_loaded",
  dataset_count: configs.length,
});

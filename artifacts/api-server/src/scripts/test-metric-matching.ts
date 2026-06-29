import { loadMetricRegistry } from "./load-metric-registry.js";
import { matchMetricFromRegistry } from "./match-metric-from-registry.js";

async function main() {
  const registry = await loadMetricRegistry();

  const examples = [
    "Personal saving rate rose to 39.2% from 36.4%",
    "Manufacturing output increased 5.8% month-on-month",
    "Business receipts increased 3.7% year-on-year",
    "Foreign direct investment flows increased",
    "Completely random sentence",
  ];

  for (const example of examples) {
    const match = matchMetricFromRegistry(example, registry.metrics);

    console.log("\nTEXT:");
    console.log(example);

    console.log("MATCH:");
    console.log(match);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

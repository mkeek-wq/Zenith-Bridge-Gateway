import fs from "node:fs";

const sourcePath =
  "data/historical-replay/m355381/historical-investigation-packages-v0.1.json";

const outputPath =
  "data/historical-replay/m355381/historical-evidence-acquisition-v0.1.json";

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

function buildEvidenceTargets(seriesName: string) {
  const lower = seriesName.toLowerCase();

  const result = {
    official_sources: [
      "Singapore EDB Manufacturing Performance",
      "Singapore MTI Economic Reports",
      "Singapore Manufacturing Statistics",
    ],
    industry_sources: [] as string[],
    company_sources: [] as string[],
    context_sources: [] as string[],
    expected_evidence_types: [] as string[],
  };

  if (lower.includes("semiconductor")) {
    result.industry_sources.push(
      "Semiconductor Industry Association",
      "WSTS"
    );

    result.company_sources.push(
      "TSMC",
      "Intel",
      "Micron",
      "GlobalFoundries"
    );

    result.context_sources.push(
      "Chip shortage",
      "Data center demand",
      "Consumer electronics demand",
      "Work-from-home demand"
    );

    result.expected_evidence_types.push(
      "Demand surge",
      "Inventory cycle",
      "Capacity expansion"
    );
  }

  if (lower.includes("petroleum")) {
    result.industry_sources.push(
      "IEA",
      "OPEC"
    );

    result.context_sources.push(
      "Oil demand",
      "Travel demand",
      "Refinery maintenance"
    );

    result.expected_evidence_types.push(
      "Demand shock",
      "Operational disruption"
    );
  }

  if (lower.includes("electronics")) {
    result.context_sources.push(
      "Global electronics demand",
      "Consumer demand",
      "Export demand"
    );

    result.expected_evidence_types.push(
      "Demand surge",
      "Export cycle"
    );
  }

  return result;
}

const packages = source.packages.map((pkg: any) => ({
  case_id: pkg.case_id,
  period: pkg.case_summary.period,
  series_name: pkg.case_summary.series_name,
  priority: pkg.case_summary.priority,
  evidence_targets: buildEvidenceTargets(
    pkg.case_summary.series_name
  ),
}));

const output = {
  historical_evidence_acquisition_version:
    "historical-evidence-acquisition-v0.1",
  generated_at: new Date().toISOString(),
  package_count: packages.length,
  packages,
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2)
);

console.log({
  version:
    output.historical_evidence_acquisition_version,
  package_count: packages.length,
  output: outputPath,
});

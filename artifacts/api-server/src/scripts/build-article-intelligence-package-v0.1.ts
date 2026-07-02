import fs from "fs";
import path from "path";

const root = process.cwd();

const workbenchFile = path.join(
  root,
  "data/intelligence/article-workbench-package-v0.2.json"
);

const graphDataFile = path.join(
  root,
  "data/intelligence/graph-data-package-v0.1.json"
);

const outputFile = path.join(
  root,
  "data/intelligence/article-intelligence-package-v0.1.json"
);

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pctChange(first: number, last: number) {
  if (!first) return null;
  return ((last - first) / first) * 100;
}

function round(value: number | null, decimals = 2) {
  if (value === null || Number.isNaN(value)) return null;
  return Number(value.toFixed(decimals));
}

function latestValue(pkg: any) {
  return Number(pkg.values?.[pkg.values.length - 1]?.value ?? 0);
}

function firstValue(pkg: any) {
  return Number(pkg.values?.[0]?.value ?? 0);
}

function valueForPeriod(pkg: any, period: string) {
  const found = pkg.values?.find((item: any) => String(item.period) === String(period));
  return found ? Number(found.value) : null;
}

function classifyTrend(values: any[]) {
  const nums = values.map((item: any) => Number(item.value)).filter((v: number) => !Number.isNaN(v));
  if (nums.length < 4) return "insufficient_history";

  const last = nums[nums.length - 1];
  const prev = nums[nums.length - 2];
  const prev2 = nums[nums.length - 3];

  if (last > prev && prev > prev2) return "recovering_expansion";
  if (last > prev && prev < prev2) return "rebound";
  if (last < prev && prev < prev2) return "declining";
  if (last < prev && prev > prev2) return "pullback_after_growth";

  return "mixed";
}

const workbench = readJson(workbenchFile);
const graphData = readJson(graphDataFile);

const allGraphPackages = graphData.packages ?? [];

const totalManufacturing = allGraphPackages.find(
  (pkg: any) => pkg.dataset_id === "SG_TOTAL_MANUFACTURING_OUTPUT_INDEX"
);

if (!totalManufacturing) {
  throw new Error("Missing SG_TOTAL_MANUFACTURING_OUTPUT_INDEX in graph data package.");
}

const rankingUniverse = allGraphPackages
  .filter((pkg: any) => pkg.dataset_id !== "SG_TOTAL_MANUFACTURING_OUTPUT_INDEX")
  .map((pkg: any) => ({
    dataset_id: pkg.dataset_id,
    title: pkg.title,
    latest_yoy_percent: Number(pkg.latest_yoy_percent ?? 0),
    ten_year_change_percent: Number(pkg.ten_year_change_percent ?? 0),
  }));

const rankedByLatestGrowth = [...rankingUniverse].sort(
  (a, b) => b.latest_yoy_percent - a.latest_yoy_percent
);

const rankedByTenYearGrowth = [...rankingUniverse].sort(
  (a, b) => b.ten_year_change_percent - a.ten_year_change_percent
);

function rankOf(datasetId: string, list: any[]) {
  const index = list.findIndex((item) => item.dataset_id === datasetId);
  return index >= 0 ? index + 1 : null;
}

const enriched = (workbench.packages ?? []).map((pkg: any) => {
  const primaryGraph = pkg.graph_packages?.[0];

  if (!primaryGraph) {
    return {
      candidate_id: pkg.candidate_id,
      title: pkg.title,
      status: "no_primary_graph_package",
      intelligence: null,
    };
  }

  const datasetId = primaryGraph.dataset_id;
  const startPeriod = primaryGraph.coverage_start;
  const endPeriod = primaryGraph.coverage_end;

  const sectorStart = valueForPeriod(primaryGraph, startPeriod);
  const sectorEnd = valueForPeriod(primaryGraph, endPeriod);

  const manufacturingStart = valueForPeriod(totalManufacturing, startPeriod);
  const manufacturingEnd = valueForPeriod(totalManufacturing, endPeriod);

  const sectorGrowth = pctChange(sectorStart ?? 0, sectorEnd ?? 0);
  const manufacturingGrowth = pctChange(manufacturingStart ?? 0, manufacturingEnd ?? 0);

  const shareStart =
    sectorStart !== null && manufacturingStart ? (sectorStart / manufacturingStart) * 100 : null;

  const shareEnd =
    sectorEnd !== null && manufacturingEnd ? (sectorEnd / manufacturingEnd) * 100 : null;

  return {
    candidate_id: pkg.candidate_id,
    title: pkg.title,
    primary_dataset_id: datasetId,
    primary_dataset_title: primaryGraph.title,
    intelligence: {
      relative_performance: {
        sector_growth_10y_percent: round(sectorGrowth),
        manufacturing_growth_10y_percent: round(manufacturingGrowth),
        outperformance_pp: round(
          sectorGrowth !== null && manufacturingGrowth !== null
            ? sectorGrowth - manufacturingGrowth
            : null
        ),
      },
      manufacturing_share: {
        start_period: startPeriod,
        end_period: endPeriod,
        share_start_percent: round(shareStart),
        share_end_percent: round(shareEnd),
        change_pp: round(
          shareStart !== null && shareEnd !== null ? shareEnd - shareStart : null
        ),
      },
      latest_momentum: {
        latest_period: primaryGraph.latest_period,
        latest_value: primaryGraph.latest_value,
        latest_yoy_percent: primaryGraph.latest_yoy_percent,
      },
      sector_ranking: {
        rank_latest_yoy_growth: rankOf(datasetId, rankedByLatestGrowth),
        rank_10y_growth: rankOf(datasetId, rankedByTenYearGrowth),
        sector_count: rankingUniverse.length,
      },
      trend_classification: {
        classification: classifyTrend(primaryGraph.values ?? []),
      },
      proxy_disclosure: {
        required: datasetId === "SG_PRECISION_ENGINEERING_OUTPUT_INDEX",
        direct_series_used: primaryGraph.source_metadata?.row_text ?? primaryGraph.title,
        limitation:
          datasetId === "SG_PRECISION_ENGINEERING_OUTPUT_INDEX"
            ? "Machinery & Equipment is used as a proxy for capital-equipment-linked precision engineering activity. Current table does not expose deeper precision-engineering subsegments."
            : null,
      },
    },
    generated_at: new Date().toISOString(),
  };
});

const output = {
  package_version: "article-intelligence-package-v0.1",
  generated_at: new Date().toISOString(),
  source_files: {
    workbench_package: "data/intelligence/article-workbench-package-v0.2.json",
    graph_data_package: "data/intelligence/graph-data-package-v0.1.json",
  },
  package_count: enriched.length,
  packages: enriched,
  sector_ranking_universe: {
    sector_count: rankingUniverse.length,
    ranked_by_latest_growth: rankedByLatestGrowth,
    ranked_by_10y_growth: rankedByTenYearGrowth,
  },
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

console.log({
  package_version: output.package_version,
  package_count: output.package_count,
  output: outputFile,
});

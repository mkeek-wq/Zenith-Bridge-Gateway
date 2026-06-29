import fs from "fs";
import path from "path";
import OpenAI from "openai";

const root = process.cwd();
const client = new OpenAI();

const inputPath = path.join(root, "data/intelligence/openai-article-package-v0.1.json");
const outPath = path.join(root, "data/intelligence/openai-generated-article-package-v0.1.json");

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function compactPackage(pkg: any) {
  return {
    candidate_id: pkg.candidate_id,
    title: pkg.title,
    article_context: pkg.article_context,
    graph_packages: (pkg.graph_packages ?? []).map((graph: any) => ({
      title: graph.title,
      unit: graph.unit,
      latest_period: graph.latest_period,
      latest_value: graph.latest_value,
      latest_yoy_percent: graph.latest_yoy_percent,
      ten_year_change_percent: graph.ten_year_change_percent,
      trend_direction: graph.trend_direction,
      values: graph.values,
      source_metadata: graph.source_metadata,
    })),
    sources: (pkg.sources ?? []).map((source: any) => ({
      name: source.name,
      source_url: source.source_url,
      source_metadata: source.source_metadata,
    })),
    governance: pkg.governance,
  };
}

async function generateArticle(pkg: any) {
  const promptPackage = compactPackage(pkg);

  const response = await client.responses.create({
    model: "gpt-5.5",
    instructions: [
      "You are the ZNBW article writing engine.",
      "Write calm, factual, business-oriented intelligence articles.",
      "Use only the provided package. Do not invent data, sources, dates, or figures.",
      "Do not mention SMURF, internal engine names, replay analysis, hidden mechanisms, or internal IDs.",
      "Do not include an Executive Summary.",
      "Use markdown.",
      "Required structure:",
      "# Title",
      "Opening paragraphs",
      "## What happened?",
      "## Why it matters",
      "## What the data shows",
      "## What businesses should watch",
      "## Sources",
      "## Confidence",
      "Keep the article publication-ready but still suitable for human editorial review.",
    ].join("\n"),
    input: JSON.stringify(promptPackage, null, 2),
  });

  return {
    generated_article_id: `AI_ARTICLE_${pkg.candidate_id}`,
    candidate_id: pkg.candidate_id,
    title: pkg.title,
    status: "ai_generated_for_human_review",
    generation_model: "gpt-5.5",
    markdown: response.output_text,
    source_package_version: "openai-article-package-v0.1",
    governance: {
      human_review_required: true,
      autonomous_publication_allowed: false,
      cms_copy_paste_required: true,
      source_check_required: true,
      internal_reference_check_required: true,
    },
    generated_at: new Date().toISOString(),
  };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const source = readJson(inputPath);
  const firstPackage = source.packages?.[0];

  if (!firstPackage) {
    throw new Error("No OpenAI article packages found.");
  }

  const article = await generateArticle(firstPackage);

  const output = {
    package_version: "openai-generated-article-package-v0.1",
    generated_at: new Date().toISOString(),
    source_file: "data/intelligence/openai-article-package-v0.1.json",
    article_count: 1,
    articles: [article],
  };

  writeJson(outPath, output);

  console.log({
    package_version: output.package_version,
    article_count: output.article_count,
    output: outPath,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

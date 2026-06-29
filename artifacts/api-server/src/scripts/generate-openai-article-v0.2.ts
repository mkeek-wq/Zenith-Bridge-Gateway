import fs from "fs";
import path from "path";
import OpenAI from "openai";

const root = process.cwd();
const client = new OpenAI();

const inputPath = path.join(
  root,
  "data/intelligence/openai-article-package-v0.2.json"
);

const protocolPath = path.join(
  root,
  "data/intelligence/protocols/znbw-editorial-protocol-v1.json"
);

const outPath = path.join(
  root,
  "data/intelligence/openai-generated-article-package-v0.2.json"
);

function readJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath: string, payload: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function compactPackage(pkg: any) {
  return {
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
      recommended_graphs: graph.recommended_graphs ?? [],
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

async function generateArticle(pkg: any, protocol: any) {
  const promptPackage = compactPackage(pkg);

  const writerInput = {
    editorial_protocol: protocol,
    article_package: promptPackage,
  };

  const response = await client.responses.create({
    model: "gpt-5.5",
    instructions: [
      "You are the ZNBW article writing engine.",
      "You must follow the supplied ZNBW Editorial Protocol exactly.",
      "Write calm, factual, structured, business-oriented institutional intelligence articles.",
      "Use only the supplied article package. Do not invent data, sources, dates, URLs, forecasts, or figures.",
      "The article must begin with a title, followed by 1-2 introduction paragraphs, followed by linked Key Takeaways.",
      "Key Takeaways must use markdown links to later article sections, for example [What the data shows](#what-the-data-shows).",
      "Use section headings that match the protocol where possible.",
      "Include graph placeholders where useful, using the format: [GRAPH: descriptive chart title].",
      "Only request graphs supported by the supplied graph packages.",
      "Include a Transparency Panel near the end with confidence, evidence base, data coverage, primary mechanism, limitations, and source notes.",
      "Include Sources after the Transparency Panel.",
      "Do not mention SMURF, internal engine names, replay analysis, hidden mechanisms, internal IDs, candidate IDs, dataset IDs, or graph package IDs.",
      "Do not include an Executive Summary.",
      "Use the supplied article_intelligence section prominently.",
      "The article must mention relative performance versus total manufacturing when available.",
      "The article must mention sector ranking when available.",
      "The article must mention manufacturing share change when available.",
      "The article must include trend classification in the Transparency Panel.",
      "If proxy_disclosure.required is true, explain the proxy limitation clearly in the Transparency Panel.",
      "Use markdown.",
      "Keep the article publication-ready but still suitable for human editorial review.",
    ].join("\n"),
    input: JSON.stringify(writerInput, null, 2),
  });

  return {
    generated_article_id: `AI_ARTICLE_${pkg.candidate_id}`,
    candidate_id: pkg.candidate_id,
    title: pkg.title,
    status: "ai_generated_for_human_review",
    generation_model: "gpt-5.5",
    editorial_protocol_version: protocol.protocol_version,
    markdown: response.output_text,
    source_package_version: "openai-article-package-v0.1",
    governance: {
      human_review_required: true,
      autonomous_publication_allowed: false,
      cms_copy_paste_required: true,
      source_check_required: true,
      internal_reference_check_required: true,
      protocol_compliance_check_required: true,
    },
    generated_at: new Date().toISOString(),
  };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const source = readJson(inputPath);
  const protocol = readJson(protocolPath);
  const firstPackage = source.packages?.[0];

  if (!firstPackage) {
    throw new Error("No OpenAI article packages found.");
  }

  const article = await generateArticle(firstPackage, protocol);

  const output = {
    package_version: "openai-generated-article-package-v0.2",
    generated_at: new Date().toISOString(),
    source_file: "data/intelligence/openai-article-package-v0.1.json",
    editorial_protocol_file:
      "data/intelligence/protocols/znbw-editorial-protocol-v1.json",
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

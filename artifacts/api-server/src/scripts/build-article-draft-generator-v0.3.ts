import fs from "fs";
import path from "path";

const inPath = path.join(
  process.cwd(),
  "data",
  "article-generator",
  "article-brief-package-v0.1.json"
);

if (!fs.existsSync(inPath)) {
  throw new Error(`Missing input file: ${inPath}`);
}

const brief = JSON.parse(fs.readFileSync(inPath, "utf8"));

const a = brief.article_identity;
const e = brief.editorial_brief;

const evidenceRows = brief.evidence_table.rows
  .map(
    (r: any) =>
      `| ${r.claim} | ${r.source} | ${r.confidence} | ${r.use} |`
  )
  .join("\n");

const publicKeyTakeaways = brief.key_takeaways.filter(
  (t: string) =>
    !t.toLowerCase().includes("avoid precise") &&
    !t.toLowerCase().includes("verified figures")
);

const keyTakeaways = publicKeyTakeaways
  .map((t: string) => `- ${t}`)
  .join("\n");

const sources = [
  "Singapore Economic Development Board\nedb.gov.sg",
  "Maritime and Port Authority of Singapore\nmpa.gov.sg",
  "Energy Market Authority\nema.gov.sg",
  "Enterprise Singapore\nenterprisesg.gov.sg",
  "Singapore Department of Statistics\nsingstat.gov.sg",
  "International Energy Agency\niea.org",
  "UN Comtrade Database\ncomtradeplus.un.org",
  "World Bank\nworldbank.org",
].join("\n\n");

const article = `# ${a.title}

${e.opening_surprise}

For many observers, this may appear surprising. Unlike major energy-producing economies, Singapore does not rely on large domestic oil or gas reserves.

Instead, its position has been built through strategic location, infrastructure investment, regulatory stability, and the development of a highly connected energy ecosystem.

Today, energy-related activity is closely linked to Singapore's broader role in shipping, logistics, petrochemicals, commodity trading, financial services, and international trade.

Understanding how Singapore achieved this position provides useful insight into both the country's economic development model and the changing energy landscape of Asia.

## Key Takeaways

${keyTakeaways}

## A Strategic Location at the Center of Global Trade

One of Singapore's most important advantages is its location.

The country sits close to major maritime routes connecting the Indian Ocean and the Pacific Ocean. This position has long supported Singapore's role as a trading and logistics hub serving both regional and global markets.

Energy flows are an important part of this system. Crude oil, refined petroleum products, liquefied natural gas, marine fuels, and related commodities move through Asian supply chains that depend heavily on shipping, storage, and trading infrastructure.

However, geography alone does not explain Singapore's success.

Many economies are located near important trade routes. Far fewer have converted geographic position into a durable energy, industrial, and services ecosystem.

## Building More Than a Port

Singapore's energy position was built over decades.

The country invested in port infrastructure, refining capacity, storage terminals, industrial land, logistics capabilities, and supporting services. Jurong Island became one of the most visible examples of this strategy, concentrating refining, petrochemical, specialty chemical, and energy-related activity in one industrial cluster.

This matters because energy hubs are not created by one asset alone.

A refinery without storage is less flexible. Storage without shipping access is less valuable. Shipping activity without trading, finance, and risk-management services captures less economic value.

Singapore's advantage comes from the way these elements reinforce one another.

## The Rise of an Energy Ecosystem

Singapore's energy role extends beyond refining or fuel supply.

Its ecosystem includes:

- shipping and maritime services,
- bunkering and marine fuels,
- storage and logistics,
- refining and petrochemicals,
- physical commodity trading,
- commodity finance,
- legal and professional services,
- and risk-management activity.

These activities are mutually reinforcing.

Shipping activity supports fuel demand. Fuel demand supports storage and supply infrastructure. Storage supports trading flexibility. Trading attracts financial, legal, and professional services. Petrochemical and refining activity deepens the industrial base.

Over time, these links helped Singapore move from being only a strategic port toward becoming a more sophisticated energy and trading platform.

## Why Singapore Matters in Global Energy Markets

Singapore's role should be understood as part of a broader Asian energy system.

Regional energy demand, manufacturing activity, shipping flows, and trade patterns all influence the value of Singapore's energy ecosystem.

This does not mean Singapore is immune to change. Energy transition policies, refining margin pressures, alternative fuels, LNG infrastructure, and changes in regional demand may all affect the country's position over time.

But Singapore's strength lies in its ability to adapt existing capabilities to new market conditions.

The same ecosystem that supported oil trading and refining may also support future activity in LNG, sustainable fuels, carbon services, and green shipping.

## Evidence Confidence Snapshot

| Claim | Source | Confidence | Use |
|---|---|---|---|
${evidenceRows}

## Why This Matters for Businesses

Singapore's energy sector shows how infrastructure, policy, and ecosystem development can create strategic advantage even without large domestic natural resources.

For businesses, this matters in several ways.

Companies involved in energy, logistics, manufacturing, shipping, infrastructure, and trade may benefit from monitoring Singapore's energy ecosystem as an indicator of broader regional activity.

Changes in shipping activity, fuel demand, refining economics, LNG infrastructure, or energy-transition policies can have implications beyond the energy sector itself.

They may affect supply chains, industrial competitiveness, logistics costs, investment decisions, and regional business planning.

Singapore's energy story is therefore not only about oil.

It is about how a small economy built a globally relevant position by combining location, infrastructure, institutions, and ecosystem depth.

## Sources & References

${sources}
`;

const output = {
  package_version: "article-draft-generator-v0.3",
  generated_at: new Date().toISOString(),
  input_package: brief.package_version,
  article_identity: a,
  generator_decision: brief.generator_decision,
  article_markdown: article,
  metadata: {
    excerpt: brief.excerpt,
    country: a.country,
    category: a.category,
    status: a.status,
    allow_exact_figures: brief.generator_decision.allow_exact_figures,
    allow_quantitative_graphs: brief.generator_decision.allow_quantitative_graphs,
  },
};

const outDir = path.join(process.cwd(), "exports", "article-generator");
fs.mkdirSync(outDir, { recursive: true });

const jsonPath = path.join(outDir, "article-draft-generator-v0.3.json");
const mdPath = path.join(outDir, "sg-energy-trading-hub-draft-v0.3.md");

fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
fs.writeFileSync(mdPath, article);

console.log({
  package_version: output.package_version,
  title: a.title,
  markdown_output: mdPath,
  json_output: jsonPath,
});

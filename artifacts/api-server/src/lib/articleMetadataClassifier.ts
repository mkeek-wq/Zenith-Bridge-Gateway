import { articles } from "@workspace/db";

export type ArticleMetadata = {
  primaryCountry: string;
  secondaryCountries: string;
  primaryCategory: string;
  secondaryCategories: string;
  sectorTags: string;
  businessTopics: string;
  workforceAttributes: string;
  infrastructureAttributes: string;
  incentiveTypes: string;
  institutions: string;
  strategicRisks: string;
};

type ArticleLike = Partial<typeof articles.$inferSelect> & {
  title?: string | null;
  excerpt?: string | null;
  category?: string | null;
  country?: string | null;
  content?: string | null;
};

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function has(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function csv(items: string[]): string {
  return unique(items).join(", ");
}

export function classifyArticleMetadata(article: ArticleLike): ArticleMetadata {
  const text = [
    article.title,
    article.excerpt,
    article.category,
    article.country,
    article.content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const secondaryCountries: string[] = [];
  const categories: string[] = [];
  const secondaryCategories: string[] = [];
  const sectors: string[] = [];
  const topics: string[] = [];
  const workforce: string[] = [];
  const infrastructure: string[] = [];
  const incentives: string[] = [];
  const institutions: string[] = [];
  const risks: string[] = [];

  const primaryCountry = article.country?.trim() || "";
  const primaryCategory = article.category?.trim() || "";

  const countryRules: Array<[string, string[]]> = [
    ["Singapore", ["singapore", "iras", "acra", "mom singapore", "edb singapore"]],
    ["Malaysia", ["malaysia", "kuala lumpur", "johor", "mida", "matrade", "jakim"]],
    ["Vietnam", ["vietnam", "hanoi", "ho chi minh", "viet nam"]],
    ["Philippines", ["philippines", "manila", "peza", "boi philippines", "bangko sentral"]],
    ["Indonesia", ["indonesia", "jakarta", "bkpm"]],
    ["Thailand", ["thailand", "bangkok", "boi thailand"]],
    ["ASEAN", ["asean", "southeast asia", "south-east asia"]],
  ];

  for (const [country, terms] of countryRules) {
    if (country !== primaryCountry && has(text, terms)) {
      secondaryCountries.push(country);
    }
  }

  if (has(text, ["tax", "corporate tax", "withholding tax", "tax incentive", "tax holiday"])) {
    categories.push("Corporate Tax");
    topics.push("Tax");
  }

  if (has(text, ["incentive", "grant", "subsidy", "tax break", "tax holiday", "economic zone", "special economic zone", "peza", "pioneer status"])) {
    categories.push("Incentives");
    topics.push("Government incentives");
  }

  if (has(text, ["fdi", "foreign direct investment", "investment promotion", "investor", "investment"])) {
    categories.push("Foreign Direct Investment");
    topics.push("Investment promotion");
  }

  if (has(text, ["workforce", "labour", "labor", "talent", "skills", "education", "english proficiency", "graduates", "nursing", "engineers"])) {
    categories.push("Workforce");
    topics.push("Talent and labour supply");
  }

  if (has(text, ["infrastructure", "port", "airport", "rail", "road", "expressway", "bridge", "logistics", "power grid", "electricity", "connectivity"])) {
    categories.push("Infrastructure");
    topics.push("Infrastructure and logistics");
  }

  if (has(text, ["manufacturing", "factory", "industrial", "electronics", "semiconductor", "semiconductors", "supply chain"])) {
    categories.push("Manufacturing");
    topics.push("Industrial development");
  }

  if (has(text, ["digital economy", "e-commerce", "fintech", "digital payments", "data center", "data centre", "cloud", "ai infrastructure"])) {
    categories.push("Technology");
    topics.push("Digital economy");
  }

  if (has(text, ["market entry", "company registration", "business setup", "licensing", "incorporation"])) {
    categories.push("Market Entry");
    topics.push("Market entry");
  }

  if (has(text, ["bpo", "it-bpm", "outsourcing", "shared services", "global services", "call center", "call centre"])) {
    sectors.push("BPO", "Shared Services");
  }

  if (has(text, ["semiconductor", "semiconductors", "electronics", "cleanroom", "chip", "chips"])) {
    sectors.push("Semiconductors", "Electronics");
  }

  if (has(text, ["halal", "jakim"])) {
    sectors.push("Halal Economy");
    topics.push("Halal certification");
  }

  if (has(text, ["islamic finance", "sukuk", "shariah", "sharia"])) {
    sectors.push("Islamic Finance");
  }

  if (has(text, ["data center", "data centre", "cloud computing", "ai infrastructure"])) {
    sectors.push("Data Centers");
    infrastructure.push("Digital infrastructure", "Power availability");
  }

  if (has(text, ["healthcare", "nursing", "medical", "hospital", "telehealth"])) {
    sectors.push("Healthcare");
  }

  if (has(text, ["renewable energy", "solar", "wind", "geothermal", "hydroelectric", "energy security"])) {
    sectors.push("Renewable Energy");
    infrastructure.push("Energy grid");
  }

  if (has(text, ["logistics", "ports", "port", "airport", "airports", "warehousing"])) {
    sectors.push("Logistics");
    infrastructure.push("Ports and airports");
  }

  if (has(text, ["tourism", "hospitality", "aviation", "travel"])) {
    sectors.push("Tourism and Hospitality");
  }

  if (has(text, ["english proficiency", "english-speaking", "english speaking"])) {
    workforce.push("English proficiency");
  }

  if (has(text, ["young workforce", "young labour", "young labor", "demographic", "working-age", "population growth"])) {
    workforce.push("Young labour force");
  }

  if (has(text, ["education", "graduates", "university", "technical skills", "engineers", "nursing workforce"])) {
    workforce.push("Education and skills pipeline");
  }

  if (has(text, ["cost competitiveness", "wages", "salary", "labour cost", "labor cost"])) {
    workforce.push("Cost competitiveness");
  }

  if (has(text, ["ports", "port throughput", "container throughput"])) {
    infrastructure.push("Port infrastructure");
  }

  if (has(text, ["airport", "airports", "aviation"])) {
    infrastructure.push("Airport infrastructure");
  }

  if (has(text, ["road", "roads", "expressway", "rail", "train", "bridge"])) {
    infrastructure.push("Transport connectivity");
  }

  if (has(text, ["internet", "connectivity", "broadband", "digital infrastructure"])) {
    infrastructure.push("Internet connectivity");
  }

  if (has(text, ["tax holiday"])) incentives.push("Tax holiday");
  if (has(text, ["tax incentive", "tax incentives", "tax break", "tax relief"])) incentives.push("Tax incentives");
  if (has(text, ["grant", "grants", "subsidy", "subsidies"])) incentives.push("Grants and subsidies");
  if (has(text, ["economic zone", "special economic zone", "peza", "industrial park"])) incentives.push("Economic zones");
  if (has(text, ["pioneer status"])) incentives.push("Pioneer status");

  const institutionRules: Array<[string, string[]]> = [
    ["IRAS", ["iras"]],
    ["ACRA", ["acra"]],
    ["MOM", ["ministry of manpower", "mom singapore"]],
    ["EDB", ["economic development board", "edb singapore"]],
    ["Enterprise Singapore", ["enterprise singapore"]],
    ["MIDA", ["mida"]],
    ["MATRADE", ["matrade"]],
    ["JAKIM", ["jakim"]],
    ["PEZA", ["peza"]],
    ["BOI Philippines", ["boi philippines", "board of investments philippines"]],
    ["Bangko Sentral ng Pilipinas", ["bangko sentral", "bsp.gov.ph"]],
    ["NEDA", ["neda", "national economic and development authority"]],
    ["DTI Philippines", ["department of trade and industry philippines", "dti.gov.ph"]],
    ["BOI Thailand", ["boi thailand"]],
    ["BKPM", ["bkpm"]],
    ["World Bank", ["world bank", "worldbank.org"]],
    ["Asian Development Bank", ["asian development bank", "adb.org"]],
  ];

  for (const [name, terms] of institutionRules) {
    if (has(text, terms)) institutions.push(name);
  }

  if (has(text, ["infrastructure limitation", "infrastructure limitations", "congestion", "clogged roads", "logistics complexity", "fragmentation"])) {
    risks.push("Infrastructure constraints");
  }

  if (has(text, ["power", "electricity", "energy security", "grid", "reliability"])) {
    risks.push("Energy reliability");
  }

  if (has(text, ["regulatory", "licensing", "compliance", "institutional complexity"])) {
    risks.push("Regulatory complexity");
  }

  if (has(text, ["geopolitical", "trade tensions", "supply-chain diversification", "supply chain diversification"])) {
    risks.push("Geopolitical and supply-chain risk");
  }

  for (const category of categories) {
    if (category !== primaryCategory) secondaryCategories.push(category);
  }

  return {
    primaryCountry,
    secondaryCountries: csv(secondaryCountries),
    primaryCategory,
    secondaryCategories: csv(secondaryCategories),
    sectorTags: csv(sectors),
    businessTopics: csv(topics),
    workforceAttributes: csv(workforce),
    infrastructureAttributes: csv(infrastructure),
    incentiveTypes: csv(incentives),
    institutions: csv(institutions),
    strategicRisks: csv(risks),
  };
}

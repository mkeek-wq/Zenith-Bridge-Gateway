import { Router, type Router as ExpressRouter } from "express";
import fs from "fs";
import path from "path";

const router: ExpressRouter = Router();
const ROOT = process.cwd();

function readJson(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function findPreviewPackageArticle(candidateId: string) {
  const previewPaths = [
    path.join(ROOT, "data", "intelligence", "article-preview-package-v0.1.json"),
    "/var/www/zenith-admin/intelligence-data/article-preview-package-v0.1.json",
  ];

  for (const previewPath of previewPaths) {
    const previewPackage = readJson(previewPath);
    const preview = previewPackage?.previews?.find(
      (item: any) => item.candidate_id === candidateId
    );

    if (preview?.article?.markdown) {
      return {
        source_type: "article_preview_package",
        source_path: previewPath,
        title: preview.title,
        markdown: preview.article.markdown,
        graph: null,
        graphs: preview.graphs || null,
        audit: preview.audit || null,
        transparency_panel: null,
        publication_decision: {
          publication_ready: preview.governance?.publication_ready ?? false,
          graph_linkage_complete:
            preview.governance?.graph_linkage_complete ?? false,
        },
        cms_status: preview.governance?.publication_ready
          ? "preview_publication_ready"
          : "preview_review_required",
      };
    }
  }

  return null;
}

function findRealArticle(candidateId: string) {
  const cmsPath = path.join(ROOT, "exports", "article-generator", "cms-finalization-package-v0.1.json");
  const publicationPath = path.join(ROOT, "exports", "article-generator", "publication-article-v0.1.json");

  const cms = readJson(cmsPath);
  const pub = readJson(publicationPath);

  const cmsOpportunityId = cms?.article_identity?.source_opportunity_id;
  const pubOpportunityId = pub?.article_identity?.source_opportunity_id;

  if (cms && cmsOpportunityId === candidateId && cms?.article_payload?.body_markdown) {
    return {
      source_type: "cms_finalization_package",
      source_path: cmsPath,
      title: cms.article_payload.title || cms.article_identity?.title,
      markdown: cms.article_payload.body_markdown,
      graph: cms.article_payload.graph || null,
      transparency_panel: cms.article_payload.transparency_panel || null,
      publication_decision: cms.publication_decision || null,
      cms_status: cms.cms_status || null,
    };
  }

  if (pub && pubOpportunityId === candidateId && pub?.publication_article) {
    return {
      source_type: "publication_article",
      source_path: publicationPath,
      title: pub.article_identity?.title || pub.publication_metadata?.title,
      markdown: pub.publication_article,
      graph: null,
      transparency_panel: null,
      publication_decision: null,
      cms_status: pub.article_identity?.status || null,
    };
  }

  return null;
}

function buildFallbackArticle(candidate: any): string {
  const title = candidate?.title || "ZNBW Intelligence Article Draft";
  const driver = candidate?.source_driver?.driver_name || "identified economic driver";
  const confidence = candidate?.signal?.confidence_score ?? "not yet scored";
  const confidenceTier = candidate?.signal?.confidence_tier || "not yet classified";
  const maturityStage = candidate?.signal?.maturity_stage || "not yet classified";
  const summary = candidate?.angle || candidate?.business_implication || "This draft was generated from the ZNBW Intelligence Engine.";

  const sourceCases = Array.isArray(candidate?.source_cases) ? candidate.source_cases : [];
  const evidenceText = sourceCases.length
    ? sourceCases.slice(0, 10).map((item: any, index: number) =>
        `${index + 1}. ${item.case_id} (${item.period}) — ${item.series_name}; confidence ${item.confidence}; driver score ${item.driver_score}; evidence count ${item.evidence_count}`
      ).join("\n")
    : "1. Source case list is not available for this opportunity.";

  return `# ${title}

## Key Takeaway

${summary}

## Intelligence Context

The current opportunity points to **${driver}** as the main interpretation lens.

Current confidence score: **${confidence}**  
Confidence tier: **${confidenceTier}**  
Maturity stage: **${maturityStage}**

## Evidence Base

${evidenceText}

## Governance Note

This is a fallback preview generated from the article opportunity queue. A richer publication package was not found for this candidate.`;
}

router.get("/:candidateId", async (req, res) => {
  const { candidateId } = req.params;

  const queuePath = path.join(ROOT, "data", "intelligence", "article-opportunity-queue-v0.1.json");
  const data = readJson(queuePath);
  const candidates = data?.opportunities || [];

  const candidate = candidates.find(
    (c: any) =>
      c.opportunity_id === candidateId ||
      c.id === candidateId ||
      c.slug === candidateId
  );

  if (!candidate) {
    return res.status(404).json({
      ok: false,
      error: "Candidate not found",
      candidateId,
      source: queuePath,
      available_candidates: candidates.map((c: any) => c.opportunity_id).slice(0, 20),
    });
  }

  const previewArticle: any = findPreviewPackageArticle(candidateId);
  const realArticle: any =
  previewArticle || findRealArticle(candidateId);

  return res.json({
    ok: true,
    candidate_id: candidateId,
    source: queuePath,
    candidate,
    article: {
      title: realArticle?.title || candidate.title || "ZNBW Intelligence Article Draft",
      status: realArticle ? "real_preview" : "fallback_preview",
      source_type: realArticle?.source_type || "opportunity_fallback",
      source_path: realArticle?.source_path || queuePath,
      markdown: realArticle?.markdown || buildFallbackArticle(candidate),
      graph: realArticle?.graph || null,
      graphs: realArticle?.graphs || null,
      audit: realArticle?.audit || null,
      transparency_panel: realArticle?.transparency_panel || null,
      publication_decision: realArticle?.publication_decision || null,
      cms_status: realArticle?.cms_status || null,
    },
  });
});

export default router;

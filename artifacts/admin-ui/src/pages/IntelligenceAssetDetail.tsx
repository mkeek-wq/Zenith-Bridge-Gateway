import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

type IntelligenceAsset = {
  asset_id: string;
  asset_type: string;
  display_name: string;
  description: string;
  source_candidate_id: string;
  source_candidate_title: string;
  origin_concept: string;
  verification_status: string;
  authority_score: number;
  authority_band: string;
  cms_usage_status: string;
  preview_status: string;
  file_path: string;
  created_at: string;
  governance_flags?: {
    human_review_required?: boolean;
    source_lineage_required?: boolean;
    public_ready?: boolean;
  };
};

type AssetDetail = {
  asset_id: string;
  asset_type: string;
  display_name: string;
  description: string;
  source_candidate_id: string;
  source_candidate_title: string;
  svg_path?: string;
  verification_status: string;
  authority_score: number;
  authority_band: string;
  cms_usage_status: string;
  preview_status: string;
  governance_flags?: {
    human_review_required?: boolean;
    source_lineage_required?: boolean;
    public_ready?: boolean;
  };
};

type AssetRegistry = {
  registry_version: string;
  generated_at: string;
  status: string;
  assets: IntelligenceAsset[];
};

function assetPreviewPath(asset: IntelligenceAsset, detail?: AssetDetail | null) {
  if (detail?.svg_path) return detail.svg_path;

  if (asset.asset_id === "GRAPH_0001") {
    return "/admin/intelligence-data/assets/GRAPH_0001-petroleum-sector-comparison-v0.1.svg";
  }

  return "";
}

function sourcePreviewId(asset: IntelligenceAsset) {
  if (asset.source_candidate_id?.startsWith("ART-")) {
    return asset.source_candidate_id;
  }

  if (asset.source_candidate_id === "CAND_0001") {
    return "ART-what-petroleum-output-reveals-about-singapore-s-exposure-to-global-energy-cycles";
  }

  return asset.source_candidate_id;
}

export default function IntelligenceAssetDetail() {
  const { assetId } = useParams();
  const [asset, setAsset] = useState<IntelligenceAsset | null>(null);
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [registry, setRegistry] = useState<AssetRegistry | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!assetId) return;

    fetch("/admin/intelligence-data/asset-registry-v0.1.json", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Asset registry load failed: ${res.status}`);
        return res.json();
      })
      .then(async (data: AssetRegistry) => {
        setRegistry(data);

        const found = data.assets.find((item) => item.asset_id === assetId);

        if (!found) {
          throw new Error(`Asset not found: ${assetId}`);
        }

        setAsset(found);

        if (found.file_path) {
          try {
            const detailRes = await fetch(found.file_path, {
              credentials: "include",
              cache: "no-store",
            });

            if (detailRes.ok) {
              setDetail((await detailRes.json()) as AssetDetail);
            }
          } catch {
            // Registry card remains usable even if detail JSON is unavailable.
          }
        }
      })
      .catch((err) => setError(err?.message || "Asset detail load failed"));
  }, [assetId]);

  if (error) {
    return (
      <div className="cms-page">
        <section className="cms-card">
          <p className="cms-kicker">Asset Error</p>
          <h1>Asset unavailable</h1>
          <p>{error}</p>
          <Link className="cms-primary-button" to="/intelligence-assets">
            Back to Asset Library
          </Link>
        </section>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="cms-page">
        <section className="cms-card">
          <p>Loading asset detail...</p>
        </section>
      </div>
    );
  }

  const previewPath = assetPreviewPath(asset, detail);
  const previewId = sourcePreviewId(asset);

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Intelligence Asset Detail</p>
          <h1>{asset.display_name}</h1>
          <p>{asset.description}</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="cms-secondary-button" to="/intelligence-assets">
            Back to Asset Library
          </Link>

          {previewId && (
            <Link
              className="cms-primary-button"
              to={`/intelligence-preview/${previewId}`}
            >
              Open Source Preview
            </Link>
          )}
        </div>
      </div>

      <section className="cms-card">
        <p className="cms-kicker">Asset Preview</p>
        <h2>{asset.asset_type}</h2>

        {previewPath ? (
          <div
            style={{
              marginTop: 16,
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 16,
              background: "white",
            }}
          >
            <img
              src={previewPath}
              alt={asset.display_name}
              style={{
                width: "100%",
                maxHeight: 760,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        ) : (
          <div className="cms-card" style={{ marginTop: 16 }}>
            <p className="cms-muted">
              No rendered preview file is available yet for this asset.
            </p>
          </div>
        )}
      </section>

      <section className="cms-card" style={{ marginTop: 16 }}>
        <p className="cms-kicker">Asset Metadata</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div className="cms-card">
            <strong>Asset ID</strong>
            <p>{asset.asset_id}</p>
          </div>

          <div className="cms-card">
            <strong>Type</strong>
            <p>{asset.asset_type}</p>
          </div>

          <div className="cms-card">
            <strong>Verification</strong>
            <p>{asset.verification_status}</p>
          </div>

          <div className="cms-card">
            <strong>Preview Status</strong>
            <p>{asset.preview_status}</p>
          </div>

          <div className="cms-card">
            <strong>Authority</strong>
            <p>
              {asset.authority_score} · {asset.authority_band}
            </p>
          </div>

          <div className="cms-card">
            <strong>CMS Usage</strong>
            <p>{asset.cms_usage_status}</p>
          </div>

          <div className="cms-card">
            <strong>Origin Concept</strong>
            <p>{asset.origin_concept}</p>
          </div>

          <div className="cms-card">
            <strong>Created</strong>
            <p>{asset.created_at ? new Date(asset.created_at).toLocaleString() : "n/a"}</p>
          </div>
        </div>
      </section>

      <section className="cms-card" style={{ marginTop: 16 }}>
        <p className="cms-kicker">Source Candidate</p>
        <h2>{asset.source_candidate_title}</h2>
        <p>{asset.source_candidate_id}</p>
      </section>

      <section className="cms-card" style={{ marginTop: 16 }}>
        <p className="cms-kicker">Governance</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div className="cms-card">
            <strong>Human Review</strong>
            <p>
              {asset.governance_flags?.human_review_required
                ? "Required"
                : "Not flagged"}
            </p>
          </div>

          <div className="cms-card">
            <strong>Source Lineage</strong>
            <p>
              {asset.governance_flags?.source_lineage_required
                ? "Required"
                : "Not flagged"}
            </p>
          </div>

          <div className="cms-card">
            <strong>Public Ready</strong>
            <p>{asset.governance_flags?.public_ready ? "Yes" : "No"}</p>
          </div>
        </div>

        <p className="cms-muted" style={{ marginTop: 16 }}>
          Registry: {registry?.registry_version ?? "n/a"} · Generated:{" "}
          {registry?.generated_at ? new Date(registry.generated_at).toLocaleString() : "n/a"}
        </p>
      </section>
    </div>
  );
}

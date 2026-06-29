import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

export default function IntelligenceAssets() {
  const [registry, setRegistry] = useState<AssetRegistry | null>(null);
  const [details, setDetails] = useState<Record<string, AssetDetail>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/admin/intelligence-data/asset-registry-v0.1.json", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load asset registry: ${response.status}`);
        }
        return response.json();
      })
      .then(async (data: AssetRegistry) => {
        setRegistry(data);

        const loadedDetails: Record<string, AssetDetail> = {};

        await Promise.all(
          data.assets.map(async (asset) => {
            if (!asset.file_path) return;

            try {
              const response = await fetch(asset.file_path, {
                credentials: "include",
              });

              if (!response.ok) return;

              const detail = (await response.json()) as AssetDetail;
              loadedDetails[asset.asset_id] = detail;
            } catch {
              // keep registry-level card visible even if detail load fails
            }
          })
        );

        setDetails(loadedDetails);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="cms-page">
        <section className="cms-card">
          <p className="cms-kicker">Asset Library Error</p>
          <h1>Unable to load asset registry</h1>
          <p>{error}</p>
        </section>
      </div>
    );
  }

  if (!registry) {
    return (
      <div className="cms-page">
        <section className="cms-card">
          <p>Loading asset registry...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="cms-page">
      <div className="cms-page-header">
        <div>
          <p className="cms-eyebrow">Intelligence Assets</p>
          <h1>Asset Library</h1>
          <p>
            Review graph, cover, and source-linked assets before CMS use.
          </p>
        </div>
      </div>

      <section className="cms-card">
        <p className="cms-kicker">Registry</p>
        <h2>{registry.registry_version}</h2>
        <p>Status: {registry.status}</p>
        <p className="cms-muted">
          Generated: {new Date(registry.generated_at).toLocaleString()}
        </p>
      </section>

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {registry.assets.map((asset) => {
          const detail = details[asset.asset_id];

          return (
            <article key={asset.asset_id} className="cms-card">
              <p className="cms-kicker">
                {asset.asset_id} · {asset.asset_type}
              </p>

              <h2>{asset.display_name}</h2>
              <p>{asset.description}</p>

              {detail?.svg_path && (
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
                    src={detail.svg_path}
                    alt={detail.display_name}
                    style={{
                      width: "100%",
                      maxHeight: 520,
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <div className="cms-card">
                  <strong>Verification</strong>
                  <p>{asset.verification_status}</p>
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
                  <strong>Preview</strong>
                  <p>{asset.preview_status}</p>
                </div>
              </div>

              <section className="cms-card" style={{ marginTop: 16 }}>
                <p className="cms-kicker">Source Candidate</p>
                <h3>{asset.source_candidate_title}</h3>
                <p>{asset.source_candidate_id}</p>

                {asset.source_candidate_id.startsWith("ART-") && (
                  <Link
                    className="cms-primary-button"
                    to={`/intelligence-preview/${asset.source_candidate_id}`}
                  >
                    Open Source Preview
                  </Link>
                )}
              </section>

              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                <Link
                  className="cms-primary-button"
                  to={`/intelligence-assets/${asset.asset_id}`}
                >
                  Open Asset Detail
                </Link>
              </div>

              <section className="cms-card" style={{ marginTop: 16 }}>
                <p className="cms-kicker">Governance</p>
                <p>
                  Human review:{" "}
                  {asset.governance_flags?.human_review_required ? "Required" : "Not flagged"}
                </p>
                <p>
                  Source lineage:{" "}
                  {asset.governance_flags?.source_lineage_required ? "Required" : "Not flagged"}
                </p>
                <p>
                  Public ready:{" "}
                  {asset.governance_flags?.public_ready ? "Yes" : "No"}
                </p>
              </section>
            </article>
          );
        })}
      </div>
    </div>
  );
}

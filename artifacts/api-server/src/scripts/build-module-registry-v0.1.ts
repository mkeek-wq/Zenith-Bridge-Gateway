import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

const modules = [
  {
    module_id: "CORE_EVIDENCE_V5",
    module_name: "Evidence Store v5",
    module_type: "core_data_store",
    version: "v5",
    status: exists("data/evidence-v5/latest.json") ? "active" : "missing",
    risk_level: "critical",
    output_path: "data/evidence-v5/latest.json",
    dependencies: [],
  },
  {
    module_id: "EVIDENCE_ASSESSMENT_V02",
    module_name: "Evidence Assessment Engine",
    module_type: "intelligence_engine",
    version: "v0.2",
    status: exists("data/intelligence/evidence-assessment-engine-v0.2.json") ? "active" : "missing",
    risk_level: "critical",
    output_path: "data/intelligence/evidence-assessment-engine-v0.2.json",
    dependencies: ["CORE_EVIDENCE_V5"],
  },
  {
    module_id: "MECHANISM_LINKER_V01",
    module_name: "Mechanism Evidence Linker",
    module_type: "intelligence_engine",
    version: "v0.1",
    status: exists("data/intelligence/mechanism-evidence-linker-v0.1.json") ? "active" : "missing",
    risk_level: "high",
    output_path: "data/intelligence/mechanism-evidence-linker-v0.1.json",
    dependencies: ["EVIDENCE_ASSESSMENT_V02"],
  },
  {
    module_id: "MECHANISM_CONFIDENCE_V02",
    module_name: "Mechanism Confidence Engine",
    module_type: "intelligence_engine",
    version: "v0.2",
    status: exists("data/intelligence/mechanism-confidence-engine-v0.2.json") ? "active" : "missing",
    risk_level: "high",
    output_path: "data/intelligence/mechanism-confidence-engine-v0.2.json",
    dependencies: ["MECHANISM_LINKER_V01"],
  },
  {
    module_id: "CASE_CONSTRUCTION_V01",
    module_name: "Case Construction Engine",
    module_type: "intelligence_engine",
    version: "v0.1",
    status: exists("data/intelligence/case-construction-engine-v0.1.json") ? "active" : "missing",
    risk_level: "high",
    output_path: "data/intelligence/case-construction-engine-v0.1.json",
    dependencies: ["EVIDENCE_ASSESSMENT_V02", "MECHANISM_CONFIDENCE_V02"],
  },
  {
    module_id: "INTELLIGENCE_BRIEF_V02",
    module_name: "Intelligence Brief Generator",
    module_type: "reporting_engine",
    version: "v0.2",
    status: exists("data/intelligence/intelligence-brief-generator-v0.2.json") ? "active" : "missing",
    risk_level: "medium",
    output_path: "data/intelligence/intelligence-brief-generator-v0.2.json",
    dependencies: ["CASE_CONSTRUCTION_V01"],
  },
  {
    module_id: "EXPERIENCE_REGISTRY_V01",
    module_name: "Experience Registry Engine",
    module_type: "learning_engine",
    version: "v0.1",
    status: exists("data/intelligence/experience-registry-engine-v0.1.json") ? "active" : "missing",
    risk_level: "high",
    output_path: "data/intelligence/experience-registry-engine-v0.1.json",
    dependencies: ["CASE_CONSTRUCTION_V01"],
  },
  {
    module_id: "EXPERIENCE_CONFIDENCE_V01",
    module_name: "Experience Confidence Engine",
    module_type: "learning_engine",
    version: "v0.1",
    status: exists("data/intelligence/experience-confidence-engine-v0.1.json") ? "active" : "missing",
    risk_level: "high",
    output_path: "data/intelligence/experience-confidence-engine-v0.1.json",
    dependencies: ["EXPERIENCE_REGISTRY_V01"],
  },
  {
    module_id: "BULK_READINESS_V01",
    module_name: "Bulk Ingestion Readiness Check",
    module_type: "ingestion_governance",
    version: "v0.1",
    status: exists("data/intelligence/bulk-ingestion-readiness-check-v0.1.json") ? "active" : "missing",
    risk_level: "critical",
    output_path: "data/intelligence/bulk-ingestion-readiness-check-v0.1.json",
    dependencies: ["CORE_EVIDENCE_V5"],
  },
  {
    module_id: "CONTROLLED_INGESTION_EXECUTOR_V01",
    module_name: "Controlled Ingestion Executor",
    module_type: "ingestion_governance",
    version: "v0.1",
    status: exists("data/ingestion/staged-ingestion/controlled-ingestion-executor-v0.1.json") ? "active" : "missing",
    risk_level: "critical",
    output_path: "data/ingestion/staged-ingestion/controlled-ingestion-executor-v0.1.json",
    dependencies: ["BULK_READINESS_V01"],
  },
  {
    module_id: "EVIDENCE_LINEAGE_V01",
    module_name: "Evidence Lineage Engine",
    module_type: "governance_engine",
    version: "v0.1",
    status: exists("data/intelligence/evidence-lineage-engine-v0.1.json") ? "active" : "missing",
    risk_level: "critical",
    output_path: "data/intelligence/evidence-lineage-engine-v0.1.json",
    dependencies: ["CONTROLLED_INGESTION_EXECUTOR_V01"],
  },
  {
    module_id: "PRODUCTION_PROMOTION_GATE_V01",
    module_name: "Production Promotion Gate",
    module_type: "governance_engine",
    version: "v0.1",
    status: exists("data/ingestion/promotion-gates/production-promotion-gate-v0.1.json") ? "active" : "missing",
    risk_level: "critical",
    output_path: "data/ingestion/promotion-gates/production-promotion-gate-v0.1.json",
    dependencies: ["EVIDENCE_LINEAGE_V01"],
  },
];

const output = {
  registry_version: "module-registry-v0.1",
  created_at: new Date().toISOString(),
  doctrine: {
    modules_are_versioned: true,
    core_engines_should_be_stable: true,
    source_adapters_should_be_replaceable: true,
    maintenance_requires_dependency_visibility: true,
  },
  summary: {
    modules_registered: modules.length,
    active_modules: modules.filter((m) => m.status === "active").length,
    missing_modules: modules.filter((m) => m.status === "missing").length,
    critical_modules: modules.filter((m) => m.risk_level === "critical").length,
  },
  modules,
};

ensureDir(path.join(ROOT, "data/maintenance"));

fs.writeFileSync(
  path.join(ROOT, "data/maintenance/module-registry-v0.1.json"),
  JSON.stringify(output, null, 2)
);

console.log({
  registry_version: output.registry_version,
  summary: output.summary,
  output: "data/maintenance/module-registry-v0.1.json",
});

console.table(
  modules.map((m) => ({
    module_id: m.module_id,
    type: m.module_type,
    version: m.version,
    status: m.status,
    risk: m.risk_level,
  }))
);

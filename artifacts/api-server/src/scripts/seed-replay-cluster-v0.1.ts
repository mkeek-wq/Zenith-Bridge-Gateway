import fs from "node:fs";
import path from "node:path";

const ROOT =
  "data/historical-replay/m355381";

const investigationDir =
  path.join(ROOT, "investigation-packages");

const evidenceDir =
  path.join(ROOT, "evidence-pilots");

const replayCases = [
  {
    case_id: "SG-EXPORT-WEAKNESS-2019",
    period: "2019",
    series_name: "Export Weakness",
    primary_driver: "MKT_003",
  },
  {
    case_id: "SG-EXPORT-WEAKNESS-2020",
    period: "2020",
    series_name: "Export Weakness",
    primary_driver: "MKT_003",
  }
];

fs.mkdirSync(investigationDir, { recursive: true });
fs.mkdirSync(evidenceDir, { recursive: true });

for (const replayCase of replayCases) {

  const investigationPath =
    path.join(
      investigationDir,
      `${replayCase.case_id.toLowerCase()}-investigation-package-v0.1.json`
    );

  const evidencePath =
    path.join(
      evidenceDir,
      `${replayCase.case_id}-evidence-v0.1.json`
    );

  const scorecardPath =
    path.join(
      evidenceDir,
      `${replayCase.case_id}-scorecard-v0.1.json`
    );

  const investigation = {
    investigation_package_version:
      "historical-investigation-package-v0.1",

    case_id: replayCase.case_id,
    period: replayCase.period,
    series_name: replayCase.series_name,

    sandbox_only: true,
    production_mutation_allowed: false
  };

  const evidence = {
    case_id: replayCase.case_id,
    evidence_assessment: {
      confidence: "high"
    }
  };

  const scorecard = {
    case_id: replayCase.case_id,
    final_attribution: {
      primary_driver: {
        driver_id: replayCase.primary_driver
      }
    }
  };

  fs.writeFileSync(
    investigationPath,
    JSON.stringify(investigation, null, 2)
  );

  fs.writeFileSync(
    evidencePath,
    JSON.stringify(evidence, null, 2)
  );

  fs.writeFileSync(
    scorecardPath,
    JSON.stringify(scorecard, null, 2)
  );

  JSON.parse(
    fs.readFileSync(investigationPath, "utf8")
  );

  JSON.parse(
    fs.readFileSync(evidencePath, "utf8")
  );

  JSON.parse(
    fs.readFileSync(scorecardPath, "utf8")
  );

  console.log(
    `Created ${replayCase.case_id}`
  );
}

console.log({
  replay_cases_created: replayCases.length
});


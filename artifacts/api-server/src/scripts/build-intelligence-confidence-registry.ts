import fs from "fs";
import path from "path";

const EXPERIENCE_PATH = "data/intelligence/experience-registry-v0.2.json";
const PRINCIPLE_PATH = "data/intelligence/principle-candidate-registry-v0.1.json";
const ACCURACY_PATH = "data/intelligence/prediction-accuracy-registry-v0.1.json";
const FEEDBACK_PATH = "data/intelligence/experience-feedback-registry-v0.1.json";

const OUTPUT_PATH = "data/intelligence/intelligence-confidence-registry-v0.1.json";

function principleScore(confidenceBand?: string): number | null {
  if (!confidenceBand) return null;
  if (confidenceBand === "strong_candidate") return 0.8;
  if (confidenceBand === "moderate_candidate") return 0.6;
  if (confidenceBand === "weak_candidate") return 0.3;
  return null;
}

function validationScore(scoredPredictions: number, accuracyRate: number | null): number | null {
  if (scoredPredictions === 0) return null;
  if (accuracyRate === null || accuracyRate === undefined) return null;
  return accuracyRate;
}

function statusFromScore(score: number | null): string {
  if (score === null) return "insufficient";
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "moderate";
  if (score >= 0.4) return "low";
  return "weak";
}

function overallConfidence(parts: {
  experience: number | null;
  principle: number | null;
  validation: number | null;
}): number | null {
  const weighted: { value: number; weight: number }[] = [];

  if (parts.experience !== null) {
    weighted.push({ value: parts.experience, weight: 0.45 });
  }

  if (parts.principle !== null) {
    weighted.push({ value: parts.principle, weight: 0.25 });
  }

  if (parts.validation !== null) {
    weighted.push({ value: parts.validation, weight: 0.3 });
  }

  if (weighted.length === 0) return null;

  const totalWeight = weighted.reduce((sum, x) => sum + x.weight, 0);
  const score =
    weighted.reduce((sum, x) => sum + x.value * x.weight, 0) / totalWeight;

  return Number(score.toFixed(3));
}

function confidenceReason(args: {
  hasExperience: boolean;
  hasPrinciple: boolean;
  scoredPredictions: number;
  feedbackType?: string;
}): string {
  const reasons: string[] = [];

  if (args.hasExperience) {
    reasons.push("historical experience available");
  } else {
    reasons.push("historical experience missing");
  }

  if (args.hasPrinciple) {
    reasons.push("principle candidate available");
  } else {
    reasons.push("principle candidate missing");
  }

  if (args.scoredPredictions > 0) {
    reasons.push("prediction validation evidence available");
  } else {
    reasons.push("prediction validation evidence not yet available");
  }

  if (args.feedbackType) {
    reasons.push(`feedback status: ${args.feedbackType}`);
  }

  return reasons.join("; ");
}

function main() {
  const experience = JSON.parse(fs.readFileSync(EXPERIENCE_PATH, "utf-8"));
  const principle = JSON.parse(fs.readFileSync(PRINCIPLE_PATH, "utf-8"));
  const accuracy = JSON.parse(fs.readFileSync(ACCURACY_PATH, "utf-8"));
  const feedback = JSON.parse(fs.readFileSync(FEEDBACK_PATH, "utf-8"));

  const experienceByDriver = new Map(
    experience.driver_experiences.map((d: any) => [d.driver_id, d])
  );

  const principleByDriver = new Map(
    principle.principles.map((p: any) => [p.driver_id, p])
  );

  const accuracyByDriver = new Map(
    accuracy.aggregates.by_driver.map((a: any) => [a.group_key, a])
  );

  const feedbackByDriver = new Map(
    feedback.feedback_records.map((f: any) => [f.driver_id, f])
  );

  const allDriverIds = Array.from(
    new Set([
      ...Array.from(experienceByDriver.keys()),
      ...Array.from(principleByDriver.keys()),
      ...Array.from(accuracyByDriver.keys()),
      ...Array.from(feedbackByDriver.keys()),
    ])
  ).sort();

  const confidence_records = allDriverIds.map((driverId) => {
    const exp: any = experienceByDriver.get(driverId);
    const prn: any = principleByDriver.get(driverId);
    const acc: any = accuracyByDriver.get(driverId);
    const fdb: any = feedbackByDriver.get(driverId);

    const experienceComponent =
      exp?.experience_strength !== undefined && exp?.confidence_score !== undefined
        ? Number(((exp.experience_strength * 0.7 + exp.confidence_score * 0.3)).toFixed(3))
        : null;

    const principleComponent = principleScore(prn?.confidence_band);

    const validationComponent = validationScore(
      acc?.scored_predictions || 0,
      acc?.accuracy_rate ?? null
    );

    const overall = overallConfidence({
      experience: experienceComponent,
      principle: principleComponent,
      validation: validationComponent,
    });

    return {
      intelligence_confidence_version: "intelligence-confidence-v0.1",
      confidence_id: `CONF-${driverId}`,
      driver_id: driverId,
      driver_label: acc?.group_label || exp?.driver_name || prn?.driver_name || driverId,

      confidence_status: statusFromScore(overall),
      overall_confidence_score: overall,

      components: {
        experience_confidence: experienceComponent,
        principle_confidence: principleComponent,
        prediction_validation_confidence: validationComponent,
      },

      component_status: {
        experience_status: statusFromScore(experienceComponent),
        principle_status: statusFromScore(principleComponent),
        prediction_validation_status: statusFromScore(validationComponent),
      },

      evidence_coverage: {
        has_experience_record: Boolean(exp),
        has_principle_candidate: Boolean(prn),
        has_prediction_accuracy_record: Boolean(acc),
        has_feedback_record: Boolean(fdb),
        scored_predictions: acc?.scored_predictions || 0,
        pending_predictions: acc?.pending_predictions || 0,
        total_predictions: acc?.total_predictions || 0,
      },

      confidence_reason: confidenceReason({
        hasExperience: Boolean(exp),
        hasPrinciple: Boolean(prn),
        scoredPredictions: acc?.scored_predictions || 0,
        feedbackType: fdb?.feedback_type,
      }),

      governance: {
        confidence_is_meta_assessment_not_truth: true,
        missing_validation_limits_confidence: true,
        human_review_required_before_business_use: true,
        auto_publish_allowed: false,
        production_mutation_allowed: false,
      },
    };
  });

  const statusCounts: Record<string, number> = {};
  for (const record of confidence_records) {
    statusCounts[record.confidence_status] =
      (statusCounts[record.confidence_status] || 0) + 1;
  }

  const output = {
    intelligence_confidence_registry_version:
      "intelligence-confidence-registry-v0.1",
    generated_at: new Date().toISOString(),
    sources: {
      experience_registry: EXPERIENCE_PATH,
      principle_candidate_registry: PRINCIPLE_PATH,
      prediction_accuracy_registry: ACCURACY_PATH,
      experience_feedback_registry: FEEDBACK_PATH,
    },
    policy: {
      principle:
        "Intelligence confidence is a meta-assessment of how much trust should be placed in driver-level intelligence based on experience, principle candidates, and prediction validation.",
      confidence_is_not_truth: true,
      confidence_does_not_update_memory: true,
      missing_validation_prevents_final_confidence: true,
      production_mutation_allowed: false,
    },
    summary: {
      drivers_assessed: confidence_records.length,
      confidence_status_counts: statusCounts,
      drivers_with_experience: confidence_records.filter(
        (r) => r.evidence_coverage.has_experience_record
      ).length,
      drivers_with_principles: confidence_records.filter(
        (r) => r.evidence_coverage.has_principle_candidate
      ).length,
      drivers_with_scored_predictions: confidence_records.filter(
        (r) => r.evidence_coverage.scored_predictions > 0
      ).length,
    },
    confidence_records,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  console.log({
    intelligence_confidence_registry_version:
      output.intelligence_confidence_registry_version,
    drivers_assessed: confidence_records.length,
    confidence_status_counts: statusCounts,
    output: OUTPUT_PATH,
  });
}

main();

# Replay Benchmark Framework v0.1

## Purpose

Replay benchmarks test whether Replay produces historically sensible mechanisms, analogues, and confidence ranges.

The benchmark does not prove prediction accuracy.

It evaluates whether Replay reasoning would be considered reasonable by an experienced analyst.

## Scoring

Each benchmark case is scored across three dimensions:

- Mechanism score: expected mechanisms identified.
- Analogue score: expected historical analogues found.
- Calibration score: confidence falls within expected range.

## Overall Score

Overall Replay Score:

- 40% mechanism score
- 40% analogue score
- 20% calibration score

## Governance Rule

Benchmark execution must not mutate production intelligence data.

Benchmark results are written only to:

governance/09-benchmarks/replay-benchmark-results/

## Versioning

Each Replay benchmark run should record:

- benchmark version
- replay output source
- run timestamp
- case scores
- overall score
- notes

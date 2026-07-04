# GRAPH_PROTOCOL_v1

Status: Active
Version: 1.0
Last Updated: 2026-07-04

Purpose:
Define how ZNBW graphs should present numbers, currencies, labels, units, and business meaning.

---

# Core Principle

Graphs should reduce cognitive load.

Readers should not need to mentally convert units, currencies, or scales to understand the message.

---

# Number Formatting

Use the highest meaningful unit.

Examples:

- 850 → 850
- 18,500 → 18.5K
- 3,450,000 → 3.45M
- 220,845,700,000 → 220.8B
- 1,500,000,000,000 → 1.5T

---

# Currency Presentation

For public international articles:

- USD is primary.
- Source-country local currency is secondary.
- Original source values should be preserved in tooltips, transparency panels, and exports.

Examples:

- Singapore: US$163.5B (S$220.8B)
- Indonesia: US$87.1B (Rp1.42T)
- Malaysia: US$45.3B (RM192.6B)

---

# Graph Requirements

Every graph should make clear:

1. What happened.
2. Compared to what.
3. Why it matters.

Graphs should use consistent units across:

- title
- axis
- tooltip
- caption
- article text

---

# Future Graph Capabilities

Future graph packages should support:

- Macro overlays
- Benchmark overlays
- Sector beta overlays
- Alpha decomposition
- Historical replay markers
- Forecast bands
- Scenario ranges

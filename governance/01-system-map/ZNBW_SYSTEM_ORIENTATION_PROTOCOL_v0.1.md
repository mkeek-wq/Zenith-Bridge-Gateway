# ZNBW System Orientation Protocol v0.1

**Date:** 08 Jul 2026
**Status:** Active
**Audience:** Humans, AI assistants, Codex, and future developers

---

# 1. Purpose

This document is the primary orientation guide for anyone entering the ZNBW repository.

The objective is not to explain every component.

The objective is to rapidly answer:

- What is this platform?
- How is it organised?
- Where should I start?
- How do I work safely?
- What already exists?
- What should I never do?

A future human or AI should be able to read this document and understand the overall system before touching any code.

---

# 2. What is ZNBW?

Zenith Nova Bridge Wave (ZNBW) is an explainable business intelligence and decision-support platform.

Its purpose is to transform raw data into business decisions through transparent intelligence pipelines.

The long-term architecture is:

Data
↓
Intelligence Engines
↓
Execution Pipelines
↓
Decision Support
↓
Business Products
↓
Client Delivery

---

# 3. Current Development Phase

Current priority is **Repository Intelligence & Controlled Integration**.

Recent work has focused on discovering, classifying and documenting existing capabilities rather than building new ones.

Current philosophy:

Discover
↓

Understand
↓

Document
↓

Qualify
↓

Connect
↓

Surface
↓

Productize

No blind coding.

---

# 4. Core Working Principles

Always follow these principles:

• Discover before building.
• Prefer connecting existing capabilities over creating duplicates.
• Preserve working systems.
• Every important discovery becomes documentation.
• Every important capability should eventually become visible.
• Safety before speed.
• Small, reversible changes.

---

# 5. Repository Layers

The repository consists of several logical layers.

Business Layer

Client products
Admin UI
Dashboards

↓

Execution Layer

Pipelines
Orchestrators
Run cycles

↓

Engine Layer

Replay
Forecast
Decision
Evidence
Macro
Publication
Governance

↓

Package Layer

Generated intelligence packages
Registries
Workbenches

↓

Data Layer

Cases
Signals
Historical data
Datasets
Articles

---

# 6. Where to Start

When beginning work, consult these in order:

1.
governance/01-system-map/

2.
governance/02-architecture/

3.
Generated registries

4.
Admin UI

5.
Source code

Documentation always comes before implementation.

---

# 7. Generated Intelligence Registries

The repository automatically generates intelligence registries.

Current core registries include:

• Intelligence Warehouse Registry
• Dependency Registry
• Engine Intelligence Registry

These registries answer questions such as:

What exists?

Who consumes it?

Who produces it?

How mature is it?

Should it be surfaced?

Should it be reviewed?

Always consult these before implementing new functionality.

---

# 8. Architecture Documentation

The Architecture folder explains:

• Engine maturity
• Product surfaces
• Dependency maps
• Pipeline discovery
• Execution architecture
• Client mapping
• Future roadmap

These documents describe the intended architecture rather than individual code.

---

# 9. Admin UI

The Admin UI is becoming the operational control centre.

It serves two purposes:

1.
Internal platform management.

2.
Repository intelligence and visibility.

Recent additions such as:

• Intelligence Warehouse

• Dependency Explorer

exist primarily to understand the platform itself before expanding client-facing products.

---

# 10. Execution Philosophy

Execution should always be controlled.

Before running an engine:

Understand its purpose.

Understand its inputs.

Understand its outputs.

Understand downstream impact.

Prefer dry-run execution whenever available.

---

# 11. Codex Reviews

Codex reviews are used to qualify important systems.

Typical review questions include:

Does it work?

Does it match documentation?

Is it still relevant?

Can it be simplified?

Can it be surfaced?

Can it become a product?

Codex should qualify important engines before large-scale integration.

---

# 12. Documentation Doctrine

Documentation is part of the product.

Whenever a significant discovery is made:

Repository
↓

Discovery

↓

Documentation

↓

Registry

↓

Qualification

↓

Integration

If knowledge exists only in conversation, it is not yet part of the platform.

---

# 13. Long-Term Vision

The objective is not merely to build software.

The objective is to build an explainable intelligence platform where every important component is:

• discoverable

• understandable

• connected

• qualified

• documented

• explainable

• reusable

• productizable

The platform should eventually be understandable without reading source code.

---

# 14. Definition of Success

A new human, AI assistant or developer should be able to:

understand the architecture,

find any important component,

understand how components interact,

understand current maturity,

understand future direction,

and contribute safely,

within approximately one hour of entering the repository.

If that is possible, the platform has become self-describing.

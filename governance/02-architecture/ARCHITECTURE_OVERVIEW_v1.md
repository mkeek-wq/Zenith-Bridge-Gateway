# ARCHITECTURE_OVERVIEW_v1

Status: Draft
Version: 1.0
Last Updated: 2026-06-23

Purpose:
Provide a domain-level architecture overview of Zenith Nova Bridge Wave.

---

# Domain Architecture

## 1. Infrastructure Layer

Responsibilities:

* VPS
* Ubuntu
* Nginx
* PM2
* PostgreSQL

Purpose:

Provide platform hosting and persistence.

---

## 2. Website Layer

Components:

* znbw-website

Purpose:

Public-facing content and business presence.

---

## 3. Editorial Layer

Components:

* Dashboard
* Article Editor
* CMS
* Publication Workflows

Purpose:

Human content management and publication.

---

## 4. Intelligence Layer

Components:

* Intelligence Center
* Datasets
* Graph Packages
* Intelligence Assets
* CMS Package Intake
* Article Workbench

Purpose:

Convert governed datasets into publishable intelligence.

---

## 5. Smurf Intelligence Engine

Components:

* Cases
* Evidence
* Mechanisms
* Experience Registry
* Macro Attribution
* Replay Assets
* Decision Support Assets

Purpose:

Generate, validate, learn and evolve intelligence.

---

## 6. Governance Layer

Components:

* Dataset Registry
* Coverage Engine
* Confidence Framework
* Evidence Lineage
* Asset Registry
* Documentation Repository

Purpose:

Ensure traceability, quality and explainability.

---

# High-Level Flow

Data
→ Intelligence
→ Workbench
→ CMS Package
→ CMS Draft
→ Editorial Review
→ Publication

---

# Future Domains

* Replay Engine
* Client Portal
* Decision Support
* Early Warning System
* Monitoring Layer

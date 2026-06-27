# CAREERGPS_INTELLIGENCE_APPLICATION_v1

**Status:** Concept Validated (Parked)

**Version:** v1.0

**Date:** 2026-06-25

**Classification:** Intelligence Application

---

# Purpose

CareerGPS is an explainable Career Intelligence platform built upon the Smurf Intelligence Core.

Unlike traditional job boards, CareerGPS is designed to function as a decision-support and coaching platform rather than a vacancy database.

Primary objective:

> Help candidates understand where they fit today, why they fit, what prevents them from qualifying for additional positions, and what the shortest path is to bridge those gaps.

The philosophy follows the same design principles as Zenith Nova Bridge Wave:

- evidence-driven
- explainable
- transparent
- actionable

---

# Current Status

## Concept Status

✅ Concept validated

The following have already been demonstrated:

- Careers@Gov architecture analysed
- SAP OData service discovered
- Job metadata extraction successful
- Job identifiers discovered
- Spreadsheet generation successful
- Repeatable ingestion path identified

Remaining work is implementation rather than feasibility.

---

# Vision

Traditional recruitment websites answer:

"What jobs exist?"

CareerGPS answers:

"Which jobs fit me, why, and how can I qualify for even more?"

CareerGPS should evolve from a search engine into a career coach.

---

# Core Principles

CareerGPS follows the same architectural philosophy as Smurf.

Pipeline:

Ingest
↓

Normalise
↓

Extract Structure
↓

Categorise
↓

Score
↓

Explain
↓

Recommend
↓

Decision Support

The engine should always explain WHY a recommendation was made.

No black-box scoring.

---

# Technical Discoveries

## Careers@Gov

Reverse engineering performed.

Discovered:

SAP OData backend

Primary endpoints identified.

Job list endpoint:

JobHeaderInfoSet

Job details endpoint:

JobDetailsSet(
    Jobid='...',
    PostingNo=guid'...'
)

Metadata discovered:

- Job ID
- Posting GUID
- Agency
- Experience
- Employment Type
- Closing Date
- Posting Date

Spreadsheet generation completed successfully.

Current limitation:

Automatic extraction of all Job Descriptions still pending.

---

# Proposed Architecture

External Job Sources

↓

Connector Layer

↓

Normalisation

↓

Job Database

↓

Job Description Parser

↓

Skill Taxonomy

↓

Candidate Profile

↓

Matching Engine

↓

Gap Analysis Engine

↓

Recommendation Engine

↓

Career Intelligence Dashboard

Connector layer should remain modular.

Each recruitment platform receives its own connector.

Smurf Intelligence Core remains unchanged.

---

# Product Roadmap

## Phase 1

✅ Metadata extraction

Spreadsheet export

## Phase 2

Automatic Job Description extraction

## Phase 3

Automatic JD parsing

Responsibilities

Requirements

Skills

Qualifications

## Phase 4

Candidate profile extraction

CV upload

Skill extraction

Experience extraction

## Phase 5

Explainable Matching

Overall Match

Technical Match

Experience Match

Leadership Match

Education Match

Domain Match

Confidence

Evidence

## Phase 6

Gap Engine

Identify missing skills

Estimate impact

Estimate effort

Bridge recommendations

Example:

Current Match

82%

Missing

Power BI

Policy drafting

Government procurement

Bridge

PL-300

Government procurement fundamentals

Expected Match

95%

## Phase 7

Career Coaching

Personal roadmap

Daily recommendations

New opportunities

Historical progress

## Phase 8

Commercial Website

User accounts

Subscriptions

Daily monitoring

Career alerts

Recruiter dashboard

---

# Future Data Sources

Potential connectors:

- Careers@Gov
- Workday
- Greenhouse
- Lever
- Ashby
- Selected corporate career portals

Each connector should translate external data into a common internal format.

---

# Relationship to Smurf

CareerGPS is NOT a separate intelligence engine.

CareerGPS is an Intelligence Application built upon the Smurf Core.

Shared components:

- ingestion philosophy
- normalisation
- explainable scoring
- evidence
- recommendation
- decision support

Only the domain changes.

---

# Long-term Opportunities

Potential future capabilities:

- Daily job monitoring
- Career trajectory planning
- Historical hiring trend analysis
- Skill demand heatmaps
- Certification recommendations
- University edition
- Recruiter edition
- Mid-career transition support

---

# Commercial Thoughts

Potential value proposition:

CareerGPS does not compete with job boards.

CareerGPS sits above them.

Job boards publish vacancies.

CareerGPS explains:

- where the candidate fits
- why
- what skills are missing
- how to bridge those gaps
- which jobs become reachable afterwards

CareerGPS functions as an explainable career coach.

---

# Current Recommendation

Project Status:

Parked.

Primary focus remains:

Zenith Nova Bridge Wave

Reason:

ZNBW remains the flagship platform.

CareerGPS represents an attractive secondary Intelligence Application once sufficient development capacity becomes available.

Estimated future implementation effort:

Prototype:
1–2 weeks

Pilot website:
4–8 weeks

Commercial platform:
3–6 months

---

# Resume Point

When development resumes:

1. Complete automatic JobDetails extraction.
2. Build JD parser.
3. Create skill taxonomy.
4. Implement CV matching.
5. Implement Gap Engine.
6. Release prototype to 5–10 users.
7. Validate demand before expanding connectors.

End of document

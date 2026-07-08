# DECISIONS.md

# Architecture Decision Records (ADR)

This document records important architectural decisions.

---

# ADR-001

Title

Use React + Vite

Status

Accepted

Reason

- Fast development
- Excellent ecosystem
- Strong community
- Modern tooling

Consequences

- SPA architecture
- React component model

---

# ADR-002

Title

Use Express.js

Status

Accepted

Reason

- Lightweight
- Flexible
- Easy REST APIs

---

# ADR-003

Title

Use SQL.js

Status

Accepted

Reason

- No external database
- Easy development
- Portable

Future

Migrate to SQLite

Later

PostgreSQL

---

# ADR-004

Title

Use Ant Design

Status

Accepted

Reason

- Enterprise UI
- Rich component library
- Professional appearance

---

# ADR-005

Title

Use React Context

Status

Accepted

Reason

Current application size does not justify Redux.

Future

Evaluate

- TanStack Query
- Zustand

---

# ADR-006

Title

Business Logic Separation

Status

Accepted

Decision

Business logic belongs

Backend

Utilities

Services

Never inside UI components.

---

# ADR-007

Title

REST API

Status

Accepted

Decision

Frontend communicates only through REST APIs.

Never access database directly.

---

# ADR-008

Title

Project Documentation

Status

Accepted

Required documents

- AGENTS.md
- PROJECT_CONTEXT.md
- ARCHITECTURE.md
- REVIEW.md
- ROADMAP.md
- CHANGELOG.md
- CONTRIBUTING.md
- DECISIONS.md

Documentation is part of the source code.

---

# ADR-009

Title

AI Development Workflow

Status

Accepted

Workflow

Understand

↓

Analyze

↓

Explain

↓

Approve

↓

Implement

↓

Verify

↓

Review

AI should never skip analysis.

---

# ADR-010

Title

Long-term Vision

Status

Accepted

Goal

Build a production-quality EPC Project Management ERP capable of supporting

- Multi-company
- Multi-project
- Procurement
- Cost Control
- Resource Planning
- Document Control
- AI Assistant
- Business Intelligence

without major architectural rewrites.
# ARCHITECTURE.md

# System Architecture

## Overview

Project Management System is a full-stack web application designed for Engineering, Procurement, and Construction (EPC) projects.

Architecture style:

Client (React)

↓

REST API (Express)

↓

Business Logic

↓

SQL.js Database

↓

JSON Persistence

The architecture follows a modular design to maximize maintainability, scalability, and code reuse.

---

# High-Level Architecture

```

┌───────────────────────────┐
│ Browser │
└──────────────┬────────────┘
│
React + Ant Design
│
Axios
│
┌──────────────▼────────────┐
│ Express API │
└──────────────┬────────────┘
│
Business Logic
│
SQL.js
│
JSON Storage

```

---

# Frontend Architecture

Framework

- React
- Vite

UI

- Ant Design

Charts

- Recharts

HTTP

- Axios

Routing

- React Router

State Management

Current

- React Context

Future

- TanStack Query (optional)
- Zustand (optional)

---

# Frontend Folder Structure

```

src/

api/
All HTTP communication.

components/
Reusable UI components.

context/
Global application state.

layout/
Application layout.

pages/
Feature pages.

assets/
Images and icons.

styles/
Future shared styling.

```

---

# Page Responsibilities

Dashboard

Responsible for

- KPI visualization
- Charts
- Progress
- Cost overview

---

Projects

Responsible for

- Project list
- Project creation
- Project metadata

---

Ports

Responsible for

- Work packages
- Port information

---

Kanban

Responsible for

- Task management
- Workflow status

---

Timeline

Responsible for

- Schedule visualization

---

Items

Responsible for

- Material items

---

Cost Log

Responsible for

- Cost tracking
- Budget tracking

---

Documents

Responsible for

- Upload
- Download
- Search

---

Reports

Responsible for

- Report generation

---

Risk Matrix

Responsible for

- Risk tracking

---

Suppliers

Responsible for

- Supplier database

---

Quotations

Responsible for

- RFQ
- Quotations

---

Team

Responsible for

- Team members

---

# Component Architecture

Components should be

Reusable

Composable

Independent

Avoid page-specific business logic inside reusable components.

---

# State Management

Current

React Context

Responsibilities

- User
- Project
- Theme (future)
- Settings (future)

Local state

useState

Complex state

useReducer (when appropriate)

Never duplicate global state.

---

# Backend Architecture

Entry point

server.js

Responsibilities

- REST API
- Validation
- Database access
- File uploads

Backend should remain stateless.

---

# API Layer

Pattern

Browser

↓

Axios

↓

Express Route

↓

Business Logic

↓

Database

↓

Response

All APIs should

- Validate input
- Return consistent JSON
- Use proper HTTP status codes

---

# Database Layer

Current

SQL.js

Persistence

JSON files

Future

SQLite

↓

PostgreSQL

Database layer should remain isolated from UI.

Business logic should never exist inside React components.

---

# Data Flow

Typical request

User Action

↓

React Component

↓

API Function

↓

Express Endpoint

↓

Business Logic

↓

Database

↓

JSON Response

↓

React State

↓

UI Update

---

# Authentication

Current

Username + password (bcrypt hash), session token (ADR-012 / ADR-013)

Future

JWT

RBAC

OAuth

Permissions

Admin

↓

Project Manager

↓

Engineer

↓

Supervisor

↓

Viewer

Authorization must always be checked on the server.

---

# Role & Permission Model (modeled, not enforced)

Global role per user (`User.role` in `database/users.json`). Enum and matrix live in `database/rbac.js`:

- **admin** — full access (all permissions)
- **pm** (Project Manager) — all project-data read/write; no user management
- **engineer** — write on items / tasks / costs / risks / documents; read-only on projects & suppliers
- **supervisor** — read + write on tasks / costs / risks; read-only elsewhere
- **viewer** — read-only

Permission keys (examples): `project:write`, `item:write`, `cost:write`, `document:upload`, `user:manage`, `rbac:read`, `report:export`.

Matrix is `ROLE_PERMISSIONS` with helper `roleCan(role, permission)`. It is also exposed read-only at `GET /api/rbac` (gated).

Status: **modeled only**. Routes are NOT yet gated by role — only the session-token gate (ADR-012) applies. Enforcement (checking `User.role` per route) is deferred to Version 1.2 (RBAC).

---

# File Upload Architecture

Current

multer

Storage

Local filesystem

Future

Cloud Storage

Azure Blob

AWS S3

Google Cloud Storage

---

# Error Handling

Every layer should handle errors.

Frontend

Display user-friendly message.

Backend

Return structured error response.

Database

Never expose internal errors.

---

# Logging

Current

Console logging

Future

Structured logging

Audit Log

Error tracking

Never expose stack traces to users.

---

# Security

Always

Validate input.

Validate uploads.

Sanitize request.

Validate IDs.

Never trust frontend input.

---

# Performance

Frontend

- Lazy loading
- Memoization
- Component reuse

Backend

- Avoid duplicate queries
- Cache when appropriate

Database

- Avoid repeated reads

---

# Coding Layers

Presentation Layer

↓

Application Layer

↓

Business Layer

↓

Persistence Layer

Each layer should have a single responsibility.

Never mix UI with business logic.

---

# Dependency Rules

Allowed

Pages

↓

Components

↓

API

↓

Server

↓

Database

Avoid

Pages calling database directly.

Components containing business rules.

Circular dependencies.

---

# Naming Conventions

Components

PascalCase

Pages

PascalCase

Hooks

useSomething

Utilities

camelCase

Constants

UPPER_CASE

Files should use descriptive names.

---

# Future Architecture

Future integrations

- Power BI
- SAP
- BIM
- OCR
- AI Assistant
- Microsoft Project
- Primavera
- Google Calendar
- Outlook

Architecture should remain modular enough to support these integrations.

---

# Architectural Principles

Always

Read before modifying.

Reuse existing modules.

Keep functions small.

Keep responsibilities isolated.

Prefer composition over duplication.

Avoid unnecessary abstractions.

---

# Non-Goals

Do not

Rewrite architecture.

Replace libraries without approval.

Move files unnecessarily.

Create duplicate implementations.

Introduce breaking API changes.

---

# Architecture Review Checklist

Before merging changes

✓ Architecture preserved

✓ Layer separation maintained

✓ No duplicated business logic

✓ API consistency maintained

✓ Database integrity preserved

✓ No unnecessary dependencies

✓ No circular imports

✓ Components remain reusable

✓ Existing functionality preserved

✓ Project remains scalable

---

# Database Risk: SQL.js ở Backend

Evaluation based on the actual code in `database/db.js` and `server.js`:

- **SQL.js is declared as a dependency but is NOT actually used.** `database/db.js` does not import or initialize `sql.js`. Persistence is implemented with plain Node.js `fs` (`fs.readFileSync` / `fs.writeFileSync`) operating on `database/projects/<id>/data.json`. The "SQL.js → JSON Persistence" chain in the Overview is aspirational; the real mechanism is direct synchronous JSON file I/O.
- Therefore the risk is NOT "WASM in-memory SQL.js". The real pattern is: each request calls `ensureDb()` which reads the whole JSON file into memory, mutates it, then `save()` writes the whole file back. There is **no transaction, no lock, no atomic commit**.

Risk level: **Real — High for multi-user** (silent data loss on concurrent writes).

How data loss happens:

- Request A: `ensureDb()` reads v1 → modifies in memory.
- Request B: `ensureDb()` reads v1 (A has not written yet) → modifies.
- A writes v2 (includes A's change).
- B writes v2' (computed from v1, so A's change is overwritten/lost).

Result: last-writer-wins, silent lost update.

Condition for the risk to actually occur:

- Two write requests (POST / PUT / DELETE / import-excel / reset) targeting the **same project** whose read→write windows overlap. This is trivially reachable with 2 concurrent users, and also possible for a single user if two async save/import operations overlap (e.g., quick successive saves, or a save racing an Excel import).
- A single request is atomic per call (`writeFileSync`), but the read-modify-write sequence is NOT atomic across requests.

Recommendation (do NOT migrate now):

- Keep current JSON storage until the app reaches active multi-user concurrent editing. This risk is recorded as a formal Decision — **ADR-011 in DECISIONS.md** — to migrate to real **SQLite** (file-based, ACID, transactional), which is already in the roadmap ("Database Layer → Future: SQLite → PostgreSQL"). Target trigger: when the system serves more than ~1 concurrent writer per project, or before any deployment with shared multi-user access. Do not rewrite to PostgreSQL yet.

---

# Configuration & Environment

Model / AI calls:

- The current web app does **not** call any AI model. If AI features are added later, the model name (e.g., "Hy3 Free" via OpenCode Zen, cloud, 256K context) must be supplied through configuration/environment — **never hardcoded** in source.

Required environment variables (derived from actual hardcoded values in `server.js` / `database/db.js`):

- `PORT` — backend port. Currently hardcoded `3001` in `server.js` (`const PORT = 3001;`).
- `DATABASE_PATH` — root directory for project data. Currently hardcoded `path.join(__dirname, 'database', 'projects')` in `db.js` (`PROJECTS_DIR`).
- `UPLOAD_DIR` — directory for uploaded documents. Currently hardcoded `path.join(__dirname, 'public', 'uploads')` in `server.js` (`uploadsDir`).
- (Optional) `CORS_ORIGIN` — currently wide open (`app.use(cors())`).

Config file location:

- **None currently.** All of the above are hardcoded constants in `server.js` and `database/db.js`. There is no `.env`, and no `config.yaml` consumed by the web backend (the `Workspace/ai-platform/config/config.yaml` belongs to a separate experimental module, not the web app). Recommended: introduce a `.env` (via `dotenv`) or `config.yaml` and read these variables at startup. Note: adding `dotenv` is a new dependency and requires approval per Non-Goals.

---

# AI Tooling Layer (ngoài phạm vi web app core)

The following directories are an **AI-assist layer for development and operations**, not part of the web application's business logic:

- `.memory/` — local Basic Memory knowledge store for AI context (currently empty).
- `.hermes/` — artifacts from Hermes document / Excel analysis (e.g., `desktop-attachments/*.xlsx`).
- `.playwright-mcp/` — Playwright MCP logs (console + page snapshots) from UI testing sessions.
- `Skills/` — AI agent skill definitions (`SKILL.md`) guiding development workflows.

These must **not** be considered part of the application runtime or the **Dependency Rules** chain (Pages → Components → API → Server → Database). They are tooling that assists development; modifying them has no effect on the deployed ERP.

---

# Data Model (tóm tắt)

Entities read from `database/db.js` + `server.js` routes. Relations are one line each.

- **Project** (`_index.json`): id, name, description, createdAt. Parent of all data; per-project store at `projects/<id>/data.json`.
- **Meta**: projectName, client, createdAt. Per-project metadata.
- **Settings**: statusProgress, etc. Per-project UI/config settings.
- **Port**: id, name, description, status, progress, contractValue, paymentReceived, budget, actual, plannedProgress. Parent of Items / CostLogs / Tasks / Documents / Risks via `id`.
- **Item**: code (key), name, port, qty, unitCost, unitPrice, internalCost, status, progress, startDate, endDate, unit, drawingCode. Belongs to Port (`port`); referenced by CostLog.itemCode, Task.itemCode, SupplierQuotation.itemCode.
- **Supplier**: id, name, … . Linked to Port via SupplierPort; referenced by SupplierQuotation.selected.
- **SupplierPort**: id, portId, supplierId, … . Join entity Port ↔ Supplier.
- **Risk**: id, probability, impact, score (= prob × impact), status, portId, … . Belongs to Port (`portId`).
- **Task**: id, title, portId, itemCode, owner, status, progress, priority, startDate, endDate, note. Belongs to Port (`portId`) and Item (`itemCode`). Note: `owner` is free text, not an FK to Team.id.
- **Team (Member)**: id, name, position, idNumber, phone, role, ports, email. Standalone; not linked to Task.owner.
- **CostLog**: id, date, portId, itemCode, costType, description, amount, remarks. Belongs to Port (`portId`) and Item (`itemCode`).
- **SupplierQuotation**: id, no, itemCode, itemName, unit, qty, supplierA / B / C, selected. References Item (`itemCode`).
- **SCurve**: week (key), date, planned, actual. Time-series per project; no FK.
- **Document**: id, filePath, fileOriginalName, fileSize, portId, … . Belongs to Port (`portId`).
- **User** — **implemented (P0)**: global store in `database/users.json` (not per-project). Fields: id, username, passwordHash (bcrypt, salt embedded), role, teamId (links to a Team member), name, createdAt. Backend: `POST /api/auth/login` verifies username + bcrypt password and issues a session token (ADR-012/013); the first admin is created via `node seed-admin.js` (deliberately NOT a public API). RBAC (enforcing `role` on routes) is deferred to Version 1.2. Note: frontend `Login` still uses the team-name select and is NOT yet wired to the password API — pending UI update.

---

# Long-Term Architecture Vision

The system should evolve into a modular ERP platform capable of managing multiple EPC projects simultaneously.

Future architecture should support

- Multi-project
- Multi-company
- Multi-user
- RBAC
- Workflow Engine
- Procurement System
- Cost Control
- Resource Planning
- Document Control
- AI Assistant
- Business Intelligence

without requiring a major rewrite.
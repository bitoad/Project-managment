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

# ADR-011

Title

Migrate JSON file storage to real SQLite (deferred)

Status

Accepted (deferred — do not implement yet)

Context

The backend persistence is implemented with plain Node.js `fs` JSON read-modify-write (`database/db.js`), not SQL.js despite the dependency declaration. Each write reads the whole `projects/<id>/data.json`, mutates it in memory, and writes it back with no transaction or lock. Two concurrent write requests to the same project cause last-writer-wins silent data loss.

Decision

- Do NOT migrate now. Keep JSON storage until the app serves active multi-user concurrent editing.
- When the system reaches more than ~1 concurrent writer per project, or before any shared multi-user deployment, migrate to real **SQLite** (file-based, ACID, transactional).
- This aligns with the existing roadmap: Database Layer → Future: SQLite → PostgreSQL. Do not jump to PostgreSQL yet.
- Any new dependency (e.g., `better-sqlite3`, `dotenv`) requires approval per Non-Goals.

Consequences

- Current single-user / low-concurrency usage remains safe.
- Risk is documented and tracked; no code change in this step.

---

# ADR-012

Title

Enforce server-side authentication on state-changing routes (hotfix)

Status

Accepted (minimal — no RBAC yet)

Context

Backend exposed all CRUD APIs with `cors()` open and no auth middleware (review finding). The frontend `Login` / `UserContext` were UI-only stubs with no backend session. Any client could call mutating endpoints without logging in.

Decision

- Introduce an in-memory session store and issue a token via `POST /api/auth/login`.
- Add a global Express middleware that requires a valid session token (Bearer / `x-auth-token`) on **every POST / PUT / DELETE** request.
- `GET` routes remain open (no sensitive data exposure assumed); login/logout routes are exempt from the gate.
- Connect the existing frontend login to the backend: `UserContext.login` now fetches and stores the token; `api.js` sends it on every request; `api.js` response interceptor clears the session and redirects to `/login` on 401.
- No password / no RBAC yet — this is the minimum viable gate (per VÁ 2 scope).

Consequences

- All writes now require a session token.
- Login UI unchanged (team-name select); it now establishes a real backend session.
- Passwords, user model, and role-based access control are deferred to the Future roadmap (RBAC).

### Route gate inventory (supplement)
- `POST /api/research/query` (Document Researcher / AI Search) — **CLOSED**: requires a valid session token (`requireAuth` explicitly + global POST/PUT/DELETE gate). Not open to anonymous clients (returns `401` without token). No new DB entity; chat history is in-session only on the frontend.

---

# ADR-013

Title

Real user authentication (P0)

Status

Accepted

Context

ADR-012 added a session-token gate, but `/api/auth/login` only issued a token from the team name with no password and no user model — anyone knowing a team name could log in.

Decision

- Add a global `User` entity in `database/users.json` (not per-project). Fields: id, username, passwordHash (bcrypt, salt embedded), role, teamId (links to a Team member), name, createdAt.
- Passwords hashed with `bcrypt` (hashSync round 10); never plaintext. Login verifies with `bcrypt.compareSync`.
- `POST /api/auth/login` now takes `{ username, password }`, verifies against the `User` entity, and issues a token (token mechanism unchanged from ADR-012).
- The first admin is created by a one-time script `node seed-admin.js` (env `ADMIN_USERNAME` / `ADMIN_PASSWORD`), deliberately NOT a public registration API, to avoid a new vulnerability. bcrypt is a new dependency (approved for this task).
- Writes to `users.json` use the existing `withWriteLock` (ADR-011).

Consequences

- Invalid credentials are now rejected (401). The old team-name-only mechanism is fully removed.
- `role` is stored but not yet enforced (RBAC deferred to Version 1.2).
- Frontend `Login` still uses the team-name select (no password field); it is NOT yet wired to the password API — pending a UI update (outside this step per task scope).

---

# ADR-014

Title

Role & permission model (modeled only)

Status

Accepted

Context

P0 delivered a real `User` with a global `role` field, but routes are only gated by session token (ADR-012); the role is not yet checked. The user requested a team role/permission structure at global scope, modeled first (not enforced).

Decision

- Global role per user (`User.role`). Enum: admin, pm, engineer, supervisor, viewer (per ARCHITECTURE Authentication section).
- Permission matrix modeled in `database/rbac.js`: `ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`, and helper `roleCan(role, permission)`.
- Exposed read-only (gated) at `GET /api/rbac`.
- Team roster (`Team`) is separate; `User.teamId` links a user to a team member.

Consequences

- The role/permission structure is real and consumable by future UI, but NOT enforced on any route yet.
- Route-level enforcement (checking `User.role` via `roleCan`) is deferred to Version 1.2 (RBAC).
- Login UI now has username + password (P0 frontend finished).

---

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

---

# ADR-015

Title

Backend input validation & upload allowlist (P2 hardening)

Context

Backend write endpoints trusted the client entirely (no validation), multer accepted any file type, and unhandled errors leaked HTML stack traces. ROADMAP P2 called for hardening.

Decision

- Add `validate.js` with `validateBody(spec)` middleware + `ValidationError` (400). Spec per endpoint: required string fields for create (identity/name), optional type/range checks for numeric fields (progress 0-100, amount/contractValue/budget/actual ≥ 0, probability/impact 1-5). Update (PUT) uses `required: false` so partial updates stay safe. Extra fields pass through untouched (non-breaking).
- Split multer into `uploadDoc` (allowlist: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, png, jpg, jpeg, gif, zip, rar, 7z, dwg) and `uploadExcel` (xls, xlsx only). Rejected types → 400 via global error handler.
- Add a global Express error handler returning JSON: `ValidationError`→400, `PORT_HAS_LINKED_DATA`→409, `MulterError`→400/413, others→500 (no stack leak).

Consequences

- Malformed/partial payloads from the existing frontend keep working; only clearly invalid data is rejected.
- Uploads are restricted to known business file types.
- All API errors return consistent JSON instead of HTML.
- Validation is intentionally lightweight (no full schema library) to avoid regressions and stay within the "minimum code" guideline.

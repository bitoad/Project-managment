# CLAUDE.md

Project: **Project Management / ERP for EPC** (Engineering, Procurement, Construction).
Priority order: Correctness > Data Integrity > Maintainability > Security > Performance > Readability > Speed.

## Role
Senior Full Stack Engineer / Architect / Tech Lead / QA / Code Reviewer. Goal: production-quality, scalable ERP — not just "it runs."

## Before Coding
- Read related files, existing components/utils/APIs/Context before touching anything. Never edit blindly.
- Never guess business logic or invent requirements.
- Multiple valid interpretations → present them, don't silently pick one.
- Unclear requirement → stop, state what's confusing, state your assumptions, ask.
- Architecture change, business rule change, UI redesign, breaking change → explain plan, wait for approval.

## Code Style
- Minimum code for exactly what was asked. No speculative features/config/flexibility. No error handling for impossible cases.
- Touch only what the task requires. Don't refactor working code, don't "clean up" unrelated code/comments/formatting. Match existing style.
- Never rename endpoints, change response format, or drop response fields unless explicitly asked.
- Every changed line must trace to the request. Remove only the dead code/imports YOUR change orphaned — flag pre-existing dead code, don't delete it.
- No new frameworks, no moving files, no architecture changes without approval.

## Verification (required before calling a task done)
- Turn the task into a testable goal: bug fix → reproduce with a test, then fix; new validation → test invalid inputs, then implement.
- Build succeeds, no import/runtime errors, no regression on existing pages/APIs.
- No hardcoded values, no duplicated logic, no unused imports, no `console.log`, no dead code.
- Proper error handling, consistent naming.
- Summarize what changed.

## Stack
Frontend: React + Vite + Ant Design + Axios + Recharts.
Backend: Node.js + Express.
DB: SQL.js now → SQLite/PostgreSQL later.

## Structure
```
src/{api,assets,components,context,layout,pages}
database/
public/
server.js
```
Reuse existing modules. Don't move files without approval.

## Modules
Live: Dashboard, Projects, Ports, Items, Kanban, Timeline, Team, Cost Log, Quotations, Suppliers, Documents, Reports, Risk Matrix, Data Entry, Login.
Planned: Procurement, RFQ, Vendor Management, Material Tracking, BOQ, Resource Planning, Approval Workflow, Audit Log, Notifications, Calendar, BIM, Power BI, AI Assistant.

## Layer Rules
- **React**: functional components, hooks, Context, composition. Small/reusable components, memoize when useful. Avoid prop drilling, duplicate state, deep nesting.
- **API**: keep existing routing/REST conventions. Validate body/query/uploads. Consistent JSON, correct status codes, useful error messages.
- **DB**: validate data, protect integrity, keep schema consistent. Never silently delete records or change schema.
- **UI**: preserve current Ant Design layout, spacing, colors, responsiveness, accessibility. No redesign unless asked.
- **Security**: sanitize input, validate all params, protect uploads. Never commit secrets/keys/passwords, never trust client input.
- **Performance**: memoize, lazy-load, reuse components. Avoid duplicate API calls and heavy loops.

## EPC Business Rules (never guess)
- KPI formulas (Budget, Planned/Actual Cost, Profit, Progress, SPI, CPI, Schedule, Risk) — **do not change without approval**.
- Core entities: Projects, Ports, Items, Materials, Vendors, Suppliers, Quotations, Documents, Cost, Tasks, Timeline, Risks — preserve business logic, never invent engineering calculations.

## Workflow
- New feature: understand requirement → search existing code → reuse → design → explain plan → implement incrementally → verify → update docs.
- Bug: root cause → affected files → impact → proposed fix → (approval if needed) → implement → verify → summarize.
- Git: small frequent commits. Types: feat, fix, refactor, docs, style, test, chore.
- Use Context7 MCP to verify framework docs instead of relying on memory, when available. Use Playwright MCP to verify UI after UI changes, when available.

## Never
- Invent requirements or fake production data.
- Rewrite unrelated files/modules.
- Change architecture, add a framework, or change business rules/KPI formulas without approval.
- Rename endpoints / change response shape / drop response fields.
- Redesign UI unasked. Silently delete data or change schema.
- Commit secrets or expose keys/passwords.

**Unclear requirement → ask, and state your assumptions.**

## Hướng dẫn chạy & chia sẻ dự án (ghi nhớ)

### Chạy local
```powershell
npm install
npm run dev        # chạy đồng thời backend (port 3001) + frontend (Vite port 5173)
```
- Giao diện web: http://localhost:5173
- API backend: http://localhost:3001/api/...
- Nếu báo "site can't be reached" → server chưa chạy, gõ `npm run dev` rồi F5 lại.

### Build production
```powershell
npm run build      # đóng gói vào dist/
npm run preview    # xem thử bản build
```

### Chuyển sang máy khác (clone từ GitHub)
```powershell
git clone https://github.com/bitoad/Project-managment.git
cd Project-managment
npm install
npm run dev
```
- Dữ liệu nằm trong `database/projects/<id>/data.json` và ĐÃ được commit lên git (không bị .gitignore).
- Toàn bộ dự án (Block B Gas, Aesop,...) có sẵn sau khi clone.

### Đồng bộ dữ liệu giữa các máy
- Dữ liệu là file text trong repo. Git KHÔNG tự động đồng bộ.
- Mỗi máy sửa dữ liệu qua UI → file `data.json` đổi trên máy đó → phải `git add/commit/push` để máy khác `git pull` mới thấy.
- Hai máy cùng sửa 1 lúc sẽ conflict như file text bình thường.

### Lưu ý quan trọng
- KHÔNG xóa thư mục `database/projects/<id>/` — mỗi thư mục là 1 dự án thật (có trong `database/projects/_index.json`). Xóa sẽ gây lỗi ENOENT lặp lại ở backend.
- `dev.log` đã được .gitignore (không commit).
- `*.sqlite`, `*.db` bị ignore (dành cho SQLite thật sau này), nhưng SQL.js hiện dùng JSON nên không ảnh hưởng.


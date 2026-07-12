# ROADMAP.md

# Project Roadmap

## Vision

Build a production-ready Project Management ERP platform for Engineering, Procurement, Construction (EPC) projects.

The platform should eventually replace spreadsheet-based project management by providing a centralized, scalable, and intelligent web application.

---

# Guiding Principles

Every new feature should improve one or more of:

- Project visibility
- Productivity
- Data accuracy
- Cost control
- Collaboration
- Automation
- Reporting
- Decision making

Avoid adding features that increase complexity without business value.

---

# Current Status

Project Stage

Version 0.5 (Foundation)

Current stack

- React
- Vite
- Express
- SQL.js
- Ant Design
- Axios
- Recharts

Core modules already exist and require continuous improvement.

---

# Đã hoàn thành

Cập nhật đến 2026-07-11.

- Hotfix race condition (JSON persistence): thêm `withWriteLock` + in-memory cache trong `database/db.js` → ghi đồng thời không mất dữ liệu. Quyết định: ADR-011. Có test hồi quy `tests/db-race.test.mjs` (PASS).
- Auth enforcement (BE): thêm session token + global middleware chặn mọi `POST/PUT/DELETE` và `GET /api/projects/:id/export-excel` khi thiếu token. Quyết định: ADR-012. Frontend `Login` / `UserContext` / `api.js` đã nối với session thật.

---

# Ưu tiên kế tiếp (thực tế)

Sắp xếp theo: (a) page gần hoàn thiện nhất → làm trước, (b) rủi ro dữ liệu / bảo mật → ưu tiên hơn page thuần UI. Giữ nguyên vị trí các mục Future (Version 0.6 → 5.0) ở cuối.

## P0 — User / Authentication backend + RBAC model (HOÀN THÀNH)

- Đã làm (2026-07-11):
  - User entity thật (`database/users.json`): id, username, passwordHash (bcrypt), role, teamId, name, createdAt.
  - `/api/auth/login` xác thực username + password (bcrypt), phát session token (ADR-013).
  - Seed admin qua `node seed-admin.js` (không mở API public).
  - **Login UI** đã có ô username + password, nối API thật.
  - **RBAC model** (global role): `database/rbac.js` định nghĩa ROLES / PERMISSIONS / ROLE_PERMISSIONS + `roleCan()`; `GET /api/rbac` (gated) trả ma trận.
- Chưa làm (deferred):
  - **Enforce role trên route** → Version 1.2 (RBAC). Hiện chỉ có token gate (ADR-012), chưa check `User.role`.

## P1 — Hoàn thiện Ports (ĐÃ XONG)

- Trạng thái: `Ports.jsx` đã nối đầy đủ `getAll` / `create` / `update` / `remove`. Modal Add & Edit dùng chung (id khóa khi sửa), cột Quản lý có nút **Sửa** + **Xóa** (Popconfirm). 13 / 13 page đã Hoàn thiện.
- Backend: thêm `DELETE /api/ports/:id` (tự động qua auth gate POST/PUT/DELETE). `deletePort` trong `db.js` cascade xóa `supplierPorts` cùng port, nhưng **chặn xóa (409) nếu port còn item / công việc / chi phí liên kết** để bảo vệ dữ liệu (không xóa ngầm).
- Đã verify: create 201 / update 200 / delete rỗng 200 + get sau xóa 404 / delete có item 409 kèm details. Build pass.
- Re-confirm 2026-07-13 (post Phase 2): FE + `portsApi` + backend đã đủ, **không cần code thêm**. Smoke test lại: DB layer create/update/delete persist đúng qua `withWriteLock` + atomic write; HTTP gate `GET=200` (mở) / `PUT=401` / `DELETE=401` (không token) → route ĐÓNG đúng ADR-012.

## P2 — Ổn định & bảo mật (ĐÃ XONG)

- **Validate input**: thêm `validate.js` (`validateBody` + `ValidationError`). Áp dụng cho mọi endpoint write (projects, ports, items, suppliers, supplier-ports, risks, tasks, team, cost-logs, quotations, documents, meta, s-curve). POST yêu cầu trường định danh/tên; PUT chỉ kiểm tra kiểu/vùng (partial update an toàn). Số bị giới hạn (progress 0-100, amount/contractValue ≥ 0, probability/impact 1-5). Không break payload frontend hiện tại.
- **Upload allowlist**: multer tách `uploadDoc` (pdf, doc, xls, xlsx, ppt, txt, csv, png, jpg, zip, dwg…) và `uploadExcel` (chỉ xls/xlsx). File sai loại → 400. Dùng cho `/api/documents` và `import-excel`.
- **Chuẩn hóa lỗi**: global error handler trả JSON (`ValidationError`→400, `PORT_HAS_LINKED_DATA`→409, `MulterError`→400/413, lỗi khác→500). Thay thế HTML stack trace.
- Đã verify: login user mới, validate 400, chặn `.exe`/`.txt` upload, `.pdf` hợp lệ 201. Build pass.
- ADR-015 ghi nhận cách tiếp cận validate không phá vỡ (non-breaking).

## Sau đó (theo roadmap hiện có)

- Version 0.7+ (Project / Ports enhancement, Cost Control, Procurement ...) tiếp tục như đã định.
- SQLite migration (ADR-011): **tạm hoãn** (khảo sát 2026-07-13: 0 lỗi ghi đồng thời, ~8–9 write/ngày, 1 process). **Trigger migrate** = bất kỳ cái nào xảy ra TRƯỚC: (a) triển khai multi-user chia sẻ thật, (b) hosting đa-process/cluster, (c) agent M8 orchestrator được nối auto-ghi CRUD, (d) file data tiến tới ~1MB. Ước tính ~4–6 ngày công (13 entity, 68 hàm `db.js`, driver `better-sqlite3` cần duyệt). Đã có safeguard tạm: atomic write + `write-metrics.log`.

---

# Version 0.6

## Objective

Stabilize the existing system.

### Priorities

- Fix existing bugs
- Remove hardcoded values
- Improve validation
- Improve error handling
- Improve code quality
- Improve folder organization
- Optimize API calls
- Improve responsiveness

Success Criteria

- Stable application
- No major runtime errors
- Clean architecture

---

# Version 0.7

## Project Management Enhancement

Modules

Projects

- Project status
- Priority
- Category
- Progress calculation

Ports

- Better hierarchy
- Work package support

Kanban

- Drag and drop
- Filters
- Search
- Due date

Timeline

- Milestones
- Dependencies

Dashboard

- Better KPIs
- Better charts

---

# Version 0.8

## Cost Control

Features

Budget

Actual Cost

Forecast Cost

Remaining Budget

Cash Flow

Earned Value

Cost Variance

Schedule Variance

SPI

CPI

Reports

Budget Dashboard

Financial Summary

Cost Trend

---

# Version 0.9

## Procurement

Modules

Supplier Management

Vendor Database

RFQ

Quotation Comparison

Purchase Request

Purchase Order

Material Tracking

Delivery Tracking

Vendor Evaluation

---

# Version 1.0

## Production Release

Complete MVP

Core Modules

Dashboard

Projects

Ports

Timeline

Kanban

Documents

Suppliers

Cost Log

Reports

Risk Matrix

Items

Quotations

Authentication

Success Criteria

Suitable for production use.

---

# Version 1.1

## Document Control

Features

Folder structure

Revision history

Document numbering

Version control

Approval workflow

Search

Metadata

Preview

---

# Version 1.2

## Team Management

Features

User management

Departments

Roles

Permissions

RBAC

Workload

Assignment

Resource planning

---

# Version 1.3

## Notification Center

Features

Email notification

In-app notification

Task reminder

Overdue warning

Approval notification

Risk notification

---

# Version 1.4

## Calendar

Google Calendar

Outlook

Meeting schedule

Milestones

Resource calendar

---

# Version 1.5

## Audit Log

Track

User

Timestamp

Old value

New value

Reason

Affected module

---

# Version 2.0

## ERP Expansion

Modules

Procurement

Inventory

Warehouse

Equipment

Asset Management

Maintenance

Contracts

Invoices

Payments

Client Portal

Vendor Portal

---

# Version 2.5

## Business Intelligence

Power BI

Interactive Dashboard

Forecast

Trend Analysis

Executive Reports

Management KPIs

---

# Version 3.0

## AI Assistant

Capabilities

Explain code

Analyze project

Suggest improvements

Generate reports

Risk prediction

Schedule optimization

Cost prediction

Document summarization

Meeting summary

Procurement recommendations

---

# Version 3.5

## OCR

Extract

Invoices

Purchase Orders

Material Lists

Technical Drawings

Certificates

Automatic indexing

---

# Version 4.0

## BIM Integration

Support

IFC

Revit

Navisworks

Model Viewer

Quantity Takeoff

Progress visualization

---

# Version 4.5

## Enterprise Integration

Microsoft Project

Primavera P6

SAP

Oracle ERP

Power BI

Microsoft Teams

SharePoint

Google Workspace

---

# Version 5.0

## Enterprise Platform

Features

Multi-company

Multi-project

Multi-tenant

Advanced RBAC

Workflow Engine

Approval Engine

Plugin System

API Gateway

Cloud Deployment

High Availability

---

# Technical Roadmap

Current

React Context

↓

Future

TanStack Query

↓

Optional

Zustand

---

Current

SQL.js

↓

SQLite

↓

PostgreSQL

---

Current

Local Storage

↓

Cloud Storage

↓

Azure Blob

AWS S3

Google Cloud Storage

---

Current

Express

↓

Modular Services

↓

Microservices (only if required)

---

# Code Quality Goals

Always improve

Architecture

Maintainability

Performance

Readability

Documentation

Testing

Security

Never rewrite the project without business justification.

---

# Documentation Roadmap

Maintain

AGENTS.md

PROJECT_CONTEXT.md

ARCHITECTURE.md

REVIEW.md

ROADMAP.md

CHANGELOG.md

CONTRIBUTING.md

README.md

Documentation should evolve together with the project.

---

# Success Metrics

Project quality will be measured by

- Stability
- Performance
- Maintainability
- Scalability
- User satisfaction
- Deployment readiness
- Code quality
- Documentation quality

---

# Long-Term Goal

Transform this project into a complete Engineering Project Management ERP platform capable of managing multiple EPC projects, multiple companies, and thousands of engineering documents, while maintaining clean architecture, reliable business logic, and a modern user experience.
# Skills Dashboard — Golden Point PM + AI Agent

> Auto-generated skill index. Mỗi skill là 1 folder con trong `/skills/`.

---

## NHÓM A — Domain / Nghiệp Vụ PM

| Skill | Agent | Trigger Keywords | Mô tả |
|-------|-------|-----------------|-------|
| `skill-project-manager` | DOC/TRACK | `tình trạng dự án`, `phân task`, `milestone`, `tóm tắt` | Điều phối tổng, dispatch task cho agent con |
| `skill-boq` | TECH | `BOQ`, `bill of quantities`, `đọc BOQ`, `validate BOQ` | Đọc/ghi/validate BOQ_Template.xlsx, VLOOKUP SSOT |
| `skill-quantity-takeoff` | TECH | `MTO`, `takeoff`, `số lượng vật tư`, `material quantity` | MTO từ bản vẽ/spec sang line items, gắn mã Item Master |
| `skill-cost-control` | TRACK | `budget`, `cost`, `variance`, `EVM`, `cảnh báo vượt chi` | So sánh budget vs actual, Earned Value, forecast |
| `skill-procurement` | PROC | `RFQ`, `báo giá`, `purchase order`, `mua hàng` | RFQ generation, so sánh报价, timeline mua hàng |
| `skill-vendor-management` | PROC | `NCC`, `nhà cung cấp`, `blacklist`, `evaluation` | Database NCC, đánh giá, lịch sử giao dịch |
| `skill-material-submittal` | DOC | `SDRL`, `VMDL`, `submittal`, `phê duyệt vật tư` | Quy trình submit vật tư, tracking approval |
| `skill-technical-review` | TECH | `spec`, `EN 10204`, `compliance`, `technical review` | Review spec/datasheet, compliance check |

---

## NHÓM B — Tech / Dev Tooling

| Skill | Trigger Keywords | Mô tả |
|-------|-----------------|-------|
| `skill-excel` | `.xlsx`, `đọc Excel`, `format sheet` | Đọc/ghi/format Excel, giữ formula & style |
| `skill-dashboard` | `dashboard`, `chart`, `KPI`, `S-Curve`, `Gantt` | KPI chart, S-Curve, Gantt render (React) |
| `skill-react` | `component`, `hook`, `state`, `React` | Coding convention frontend, component structure |
| `skill-express` | `API`, `route`, `controller`, `middleware` | Backend convention, route/controller pattern |
| `skill-database` | `schema`, `database`, `migration`, `model` | Schema design, migration, query pattern |
| `skill-api` | `endpoint`, `REST`, `request schema` | REST endpoint design, response schema |
| `skill-authentication` | `login`, `auth`, `JWT`, `role`, `permission` | Auth flow, role-based access, JWT |
| `skill-ui-design` | `theme`, `color`, `dark mode`, `style guide` | Design token, dark minimalist theme |
| `skill-bug-fix` | `bug`, `error`, `debug`, `lỗi` | Quy trình debug: repro → isolate → fix |
| `skill-testing` | `test`, `unit test`, `coverage`, `mock` | Unit/integration test convention |
| `skill-deployment` | `deploy`, `build`, `production`, `rollback` | Build/deploy pipeline, env config |
| `skill-documentation` | `doc`, `README`, `changelog`, `API doc` | Chuẩn viết doc code + doc nghiệp vụ |
| `skill-git-workflow` | `git`, `branch`, `commit`, `PR` | Branch naming, commit convention, PR checklist |

---

## Quick Reference

### Agent → Skill Mapping
| Agent | Skills |
|-------|--------|
| DOC | `skill-project-manager`, `skill-material-submittal`, `skill-documentation` |
| TRACK | `skill-project-manager`, `skill-cost-control`, `skill-dashboard` |
| COMM | `skill-project-manager`, `skill-documentation` |
| TECH | `skill-boq`, `skill-quantity-takeoff`, `skill-technical-review`, `skill-excel` |
| PROC | `skill-procurement`, `skill-vendor-management` |

### Vertical → Edge Cases
| Vertical | Skills cần attention |
|----------|---------------------|
| EPC/Oil&Gas | `skill-boq` (prelims), `skill-technical-review` (multi-standard), `skill-procurement` (long lead) |
| Interior Fitout | `skill-boq` (by zone), `skill-material-submittal` (mock-up), `skill-cost-control` (landlord changes) |
| Retail/Artë | `skill-procurement` (volume discount), `skill-material-submittal` (brand approval) |
| Events | `skill-project-manager` (short timeline), `skill-procurement` (urgent orders) |

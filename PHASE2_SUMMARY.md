# Phase 2 Summary — Kích hoạt 7 Workflow AI Platform (M1–M8)

> Nền: `Workflow/AI_Platform_7_Workflows.md`. File này cập nhật số liệu THẬT sau khi hoàn thành M5/M6/M7 và build Master Orchestrator (M8).

## Trạng thái 7 Workflow (cập nhật cuối Phase 2)

| # | Workflow | Agent chính | Trạng thái | Milestone | Commit |
|---|---|---|---|---|---|
| 1 | Build Web App | Software Engineer | ✅ ACTIVE | M3 | `451da6c` |
| 2 | Technical Document Research | Document Researcher | ✅ ACTIVE (có AI Search page) | M2 | `8a7b6e5` |
| 3 | Drawing Analysis | Drawing Analyzer | 🔶 PARTIAL — chỉ text/dimension extraction; object-detect ⛔ BLOCKED (ADR-016, hoãn vision-LLM) | M6 | `fd6cde8` |
| 4 | BOQ / Quantity Takeoff | BOQ Engineer | 🔶 PARTIAL — Quantity Calculation → Cost Estimate chạy được; input tự động từ bản vẽ chờ M6 lên FULL | M5 | `f13c66a` |
| 5 | Procurement | Procurement Agent | ✅ ACTIVE | M4 | `4e0ead9` |
| 6 | Report Generation | Report Writer | ✅ ACTIVE | M1 | (M1) |
| 7 | Website Cloner & UI/UX | Website Cloner + UI Designer | 🔶 PARTIAL — React thuần + Tailwind, KHÔNG sinh Next.js (giới hạn stack Vite hiện tại) | M7 | `e435ca0` |
| — | **Master Orchestrator** | Project Manager | ✅ ACTIVE (route-only, không auto-invoke) | M8 | (chưa commit) |

## Cập nhật số liệu mới nhất (khác bản nền)

- **M5 (BOQ):** đã có `agents/boq-engineer/smoke-output.json` — seed A001/A003/A004, margin 50.9%. Trạng thái nâng từ "chưa có" → **PARTIAL đã smoke-test**.
- **M6 (Drawing Analysis):** bản nền ghi "ĐANG KHẢO SÁT — chưa xác định khả thi". Kết quả thật: **text/dimension extraction khả thi (PARTIAL)**; object-detection **BLOCKED** do quyết định **ADR-016** hoãn vision-LLM (GLM-5.2 image) chờ review rủi ro data-egress. Playwright 1.61.1 dùng cho DOM extraction, KHÔNG dùng vision-LLM.
- **M7 (Website Cloner & UI/UX):** bản nền ghi "CHƯA BẮT ĐẦU". Kết quả thật: **PARTIAL** — gộp Cloner + UI Designer thành 1 agent (`website-cloner-uiux`), smoke-test clone example.com, output `smoke-example.jsx` esbuild-valid, **KHÔNG sinh Next.js** (chốt theo stack Vite+React hiện tại).

## Master Orchestrator (M8)

- Agent: `agents/project-manager/SKILL.md`. Input `{task}` → Output `{agent, reasoning, note?}`.
- **Route-only**: chỉ quyết định agent, KHÔNG tự gọi agent thật — có người duyệt mới thực thi.
- KHÔNG tạo route API mới (đã chốt ở M8 Bước 2).
- Đã thêm dòng `Orchestrator: ACTIVE (M8)` vào cả 10 `workflows/*/workflow.md` (7 workflow Phase 2 + 3 workflow gốc: add-new-page, export-report, pre-merge-check).
- Flow chuẩn: `User → Project Manager → Planner → Assign Agent → Specialized Agent → Review → OfficeCLI Export → User`.

## ADR/quyết định liên quan

- **ADR-011:** JSON write-lock — mọi agent ghi dữ liệu phải tuân.
- **ADR-012:** Auth gate — mọi route API mới phải qua gate (POST/PUT/DELETE cần token; GET mở). M2 `POST /api/research/query` = CLOSED.
- **ADR-016:** Hoãn vision-LLM cho phân tích bản vẽ (data-egress risk) → M6 object-detect BLOCKED.
- Firecrawl IP-blocked (từ M2) — Document Researcher & Procurement có fallback websearch; cần API key thật để dùng chính thức (backlog).

## Kết quả Phase 2

- 4/7 workflow **ACTIVE**: #1 Build Web App, #2 Document Research, #5 Procurement, #6 Report Generation.
- 3/7 **PARTIAL**: #3 Drawing Analysis, #4 BOQ, #7 Website Cloner (mỗi cái có lý do chặn rõ ràng, đã ghi ADR/giới hạn stack).
- Master Orchestrator (M8) **ACTIVE** ở chế độ route-only.
- Tổng: 8 agent (`agents/*`), 10 workflow (`workflows/*`).

# Workflow: report-generation

> **Orchestrator: ACTIVE (M8)** — điều phối bởi Project Manager agent (`agents/project-manager/SKILL.md`).

Chuẩn hóa flow xuất báo cáo Project Control ra NHIỀU định dạng (docx / xlsx / pptx / pdf).
Tái sử dụng logic đã có: `src/pages/Reports.jsx` (jsPDF, PDF), `Workspace/ai-platform/tools/officecli/officecli.py` (docx/xlsx/pptx), và excel MCP (xlsx).
Output dữ liệu khớp `output-schema.json`.

> Nguồn dữ liệu: `GET /api/dashboard` + `/api/ports` + `/api/risks` (theo project). Không hardcode giá trị.

## Bước tuần tự

- [ ] **1. Thu thập dữ liệu** — Lấy `meta`, `kpi`, `ports`, `risks` từ API của project đang chọn. Không hardcode.
- [ ] **2. Chuẩn hóa data theo `output-schema.json`** — Map về đúng cấu trúc (meta / kpi / ports / risks). Thiếu field → `'-'`, không bịa số.
- [ ] **3. Chọn định dạng** — Xác định `format` ∈ {`docx`, `xlsx`, `pptx`, `pdf`} từ yêu cầu.
- [ ] **4. [ACTIVE] Report Writer (lớp điều phối)** — Gọi agent `agents/report-writer/` với input `{data, format}`. Agent tự route:
  - `docx` / `pptx` → **OfficeCLI** (`officecli.export_docx` / `officecli.export_pptx`)
  - `xlsx` → **excel MCP** (Excel tools)
  - `pdf` → **jsPDF** (`src/pages/Reports.jsx`)
  - Agent KHÔNG viết lại logic export — chỉ gọi đúng công cụ. Chi tiết routing: `agents/report-writer/SKILL.md`.
- [ ] **5. Xuất file** — Đường dẫn theo format (`*.docx` / `*.xlsx` / `*.pptx` / `*.pdf`).
- [ ] **6. Verify** — Xem `checklist.md` (bao gồm mở file thật, check số liệu khớp Dashboard).

## Ràng buộc

- Chỉ gọi công cụ có sẵn (OfficeCLI / excel MCP / jsPDF). Không viết lại logic export.
- KHÔNG đổi công thức/ý nghĩa KPI (chỉ trình bày).
- Font: PDF dùng ASCII cho nhãn (như `Reports.jsx`) để tránh vỡ dấu tiếng Việt trong jsPDF core. docx/xlsx/pptx giữ nguyên Unicode (python-docx/openpyxl/python-pptx hỗ trợ).
- Không `console.log`, không dead code.

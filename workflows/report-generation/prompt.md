# Prompt mẫu: report-generation

Copy prompt dưới, điền `{{...}}`, gửi cho Hy3.

---

Chạy workflow `workflows/report-generation/workflow.md` để xuất báo cáo Project Control.

**Project**: `{{ten hoac id project}}`
**Định dạng**: `{{docx | xlsx | pptx | pdf}}`
**Sections cần có**: `{{KPI | Port performance | Rui ro | ...}}`
**Ghi chú riêng** (nếu có): `{{mo ta}}`

Yêu cầu:
- Lấy dữ liệu từ API của project, không hardcode. Output khớp `workflows/report-generation/output-schema.json`.
- Dùng agent `agents/report-writer/` để route đúng công cụ theo định dạng (docx/pptx→OfficeCLI, xlsx→excel MCP, pdf→jsPDF). KHÔNG viết lại logic export.
- KHÔNG đổi công thức/ý nghĩa KPI. Thiếu dữ liệu để `'-'`, không bịa số.
- Xong thì chạy `checklist.md`, xuất thử 1 file thật và báo cáo pass/fail + tóm tắt thay đổi.

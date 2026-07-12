# Prompt mẫu: export-report

Copy prompt dưới, điền `{{...}}`, gửi cho Hy3.

---

Chạy workflow `workflows/export-report/workflow.md` để tạo/điều chỉnh báo cáo PDF.

**Phạm vi**: `{{tao moi | sua section co san | them section moi}}`
**Project**: `{{ten hoac id project}}`
**Sections cần có**: `{{KPI | Port performance | Rui ro | ...}}`
**Thay đổi cụ thể** (nếu sửa): `{{mo ta}}`

Yêu cầu:
- Tái sử dụng logic trong `src/pages/Reports.jsx`, không thêm thư viện PDF mới.
- Output phải khớp `workflows/export-report/output-schema.json`.
- KHÔNG đổi công thức/ý nghĩa KPI (chỉ trình bày). Thiếu dữ liệu để `'-'`, không bịa số.
- Xong thì chạy `checklist.md`, xuất thử 1 file PDF và báo cáo pass/fail + tóm tắt thay đổi.

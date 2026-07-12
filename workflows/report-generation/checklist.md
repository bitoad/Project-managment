# Checklist DONE: report-generation

## Dữ liệu
- [ ] Dữ liệu lấy từ API theo project đang chọn, không hardcode.
- [ ] Cấu trúc khớp `output-schema.json` (meta / kpi / ports / risks).
- [ ] Field thiếu để `'-'`, không bịa số liệu.

## Routing (Report Writer)
- [ ] `format` ∈ {docx, xlsx, pptx, pdf} đã xác định rõ.
- [ ] docx / pptx → OfficeCLI (`Workspace/ai-platform/tools/officecli/officecli.py`).
- [ ] xlsx → excel MCP (Excel tools), KHÔNG qua OfficeCLI.
- [ ] pdf → jsPDF (`src/pages/Reports.jsx`).
- [ ] Agent KHÔNG viết lại logic export — chỉ gọi đúng công cụ.

## Nội dung
- [ ] Header: tiêu đề + khối meta (Du an/Nha thau/Khach hang/Dia diem/Ngay BC).
- [ ] Section 1 KPI đầy đủ; công thức KPI KHÔNG bị thay đổi.
- [ ] Section 2 Port performance đúng cột.
- [ ] Section 3 Rủi ro (ẩn nếu không có high risk).
- [ ] pptx: mỗi slide có title + content. docx: có heading + body.

## Chất lượng
- [ ] Chỉ dùng công cụ có sẵn (OfficeCLI / excel MCP / jsPDF); không thêm dependency export mới.
- [ ] PDF: nhãn ASCII, không vỡ ký tự; chỉ jspdf + jspdf-autotable.
- [ ] docx/xlsx/pptx: giữ Unicode bình thường.
- [ ] Không `console.log`, không dead code.

## Verify chạy thật
- [ ] Xuất được file thật (mở đọc bình thường, đúng định dạng).
- [ ] Số liệu trong file khớp Dashboard của cùng project.

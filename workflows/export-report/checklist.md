# Checklist DONE: export-report

## Dữ liệu
- [ ] Dữ liệu lấy từ API theo project đang chọn, không hardcode.
- [ ] Cấu trúc khớp `output-schema.json` (meta / kpi / ports / risks).
- [ ] Field thiếu để `'-'`, không bịa số liệu.

## Nội dung PDF
- [ ] Header: tiêu đề + subtitle + khối meta (Du an/Nha thau/Khach hang/Dia diem/Ngay BC).
- [ ] Section 1 KPI đầy đủ; công thức KPI KHÔNG bị thay đổi.
- [ ] Section 2 Port performance đúng cột.
- [ ] Section 3 Rủi ro (ẩn nếu không có high risk).
- [ ] Footer CONFIDENTIAL + số trang trên mọi trang.
- [ ] Tên file: `Bao_cao_tong_quan_YYYY-MM-DD.pdf`.

## Chất lượng
- [ ] Chỉ dùng jspdf + jspdf-autotable sẵn có; không thêm dependency.
- [ ] `npm run build` OK; không lỗi runtime khi bấm export.
- [ ] Nhãn ASCII, không vỡ ký tự.
- [ ] Không `console.log`, không dead code.

## Verify chạy thật
- [ ] Xuất được file PDF mở đọc bình thường.
- [ ] Số liệu trong PDF khớp Dashboard của cùng project.

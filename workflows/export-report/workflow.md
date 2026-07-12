# Workflow: export-report

> **Orchestrator: ACTIVE (M8)** — điều phối bởi Project Manager agent (`agents/project-manager/SKILL.md`).

Chuẩn hóa flow xuất báo cáo PDF (Project Control Report) — tái sử dụng logic đã có trong `src/pages/Reports.jsx` (jsPDF + jspdf-autotable).

> Nguồn dữ liệu: `GET /api/dashboard` + `/api/ports` + `/api/risks` (theo project). Output khớp `output-schema.json`.

## Bước tuần tự

- [ ] **1. Thu thập dữ liệu** — Lấy `meta` (projectName, contractor, client, location), `kpi`, `ports`, `risks` từ API của project đang chọn. Không hardcode giá trị.
- [ ] **2. Chuẩn hóa data theo `output-schema.json`** — Map dữ liệu về đúng cấu trúc (meta / kpi / ports / risks). Thiếu field → để `'-'` như code hiện tại, không bịa số.
- [ ] **3. Header** — `drawHeader(doc, subtitle)`: tiêu đề `PROJECT CONTROL REPORT`, subtitle, và khối meta (Du an / Nha thau / Khach hang / Dia diem / Ngay BC = ngày hiện tại `toLocaleDateString('vi-VN')`).
- [ ] **4. Section 1 — KPI** — `autoTable` head `['Chi so','Gia tri','Ghi chu']`, body gồm các KPI (Budget, Planned/Actual Cost, Profit, Progress, SPI, CPI, Schedule, Risk). ⚠️ KHÔNG đổi công thức KPI (AGENTS.md) — chỉ trình bày.
- [ ] **5. Section 2 — Hiệu suất theo Port** — head `['Port','Mo ta','Tien do %','Doanh thu','Chi phi da ghi','Items']`, body map từ `data.ports`.
- [ ] **6. Section 3 — Rủi ro ưu tiên** — head `['Rui ro','Port','Score','Phu trach']`, body từ high risks (lọc theo score). Bỏ section nếu không có high risk (như code hiện tại).
- [ ] **7. Footer** — Mỗi trang: `CONFIDENTIAL - Golden Point Co., Ltd | Trang i/n`.
- [ ] **8. Xuất file** — `doc.save('Bao_cao_tong_quan_' + YYYY-MM-DD + '.pdf')`.
- [ ] **9. Verify** — Xem `checklist.md`.

## Ràng buộc
- Chỉ dùng `jspdf` + `jspdf-autotable` đã có; không thêm thư viện PDF mới.
- Không thay đổi công thức/ý nghĩa KPI.
- Font: dùng ASCII cho nhãn (như code hiện tại) để tránh vỡ dấu tiếng Việt trong jsPDF core.

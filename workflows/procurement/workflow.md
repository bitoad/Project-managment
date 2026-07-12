# Workflow: Procurement

> **Orchestrator: ACTIVE (M8)** — điều phối bởi Project Manager agent (`agents/project-manager/SKILL.md`).

Pipeline mua sắm vật tư EPC: từ BOQ → tìm NCC → RFQ → so sánh báo giá → đề xuất.
Chuẩn tham chiếu là tiền lệ RFQ/so sánh báo giá thật ngoài hệ thống (Bulong Alpha, RS Group, CEPRO, Nederman...).
Agent `procurement` là lớp điều phối — KHÔNG viết lại logic, chỉ route đến công cụ CÓ SẴN.

```
BOQ ──▶ Procurement Agent ──▶ Vendor Search ──▶ RFQ ──▶ Compare Quotations ──▶ Recommendation
              │
              ├─(1)─ Internal check: suppliersApi.getAll()  (ưu tiên NCC nội bộ, tránh trùng)
              ├─(2)─ External search: firecrawl_search/scrape (fallback websearch nếu IP-blocked)
              ├─(3)─ RFQ draft (từ item + shortlist)
              └─(4)─ Compare + Recommend (dùng quotationsApi nếu đã có báo giá trong hệ thống)
```

## Stages

### 1. BOQ — [ACTIVE]
Nguồn hạng mục cần mua (từ Items / BOQ module). Mỗi item: `description`, `quantity`, `specs?`.

### 2. Procurement Agent — [ACTIVE]
Agent điều phối (xem `agents/procurement/SKILL.md`). Nhận `{itemDescription, quantity, specs?}`, trả về Vendor shortlist + RFQ draft + Comparison + Recommendation theo `output-schema.json`.

### 3. Vendor Search — [ACTIVE]
- Nội bộ: `suppliersApi.getAll()` (frontend) / `db.getSuppliers(projectId)` (backend) — match theo `supplier.type` / `name`.
- Ngoài: `firecrawl_search` + `firecrawl_scrape`. Nếu firecrawl bị chặn IP (đã ghi nhận ở M2) → `websearch-fallback`.

### 4. RFQ — [ACTIVE]
Tạo nháp RFQ gửi shortlist. KHÔNG tạo route API mới trừ khi cần expose qua UI (khi đó phải qua ADR-012 gate, báo trước).

### 5. Compare Quotations — [ACTIVE]
Bảng so sánh. Nếu đã có báo giá trong hệ thống → dùng `quotationsApi` (`db.getSupplierQuotations`). KHÔNG bịa giá.

### 6. Recommendation — [ACTIVE]
Đề xuất NCC tốt nhất (ưu tiên nội bộ nếu khớp; tiêu chí: coverage tiêu chuẩn, chứng nhận, lead time, giá). KHÔNG bịa số.

## Notes
- Ưu tiên NCC nội bộ để tránh duplicate data; chỉ search ngoài khi nội bộ không đủ.
- KHÔNG sửa `suppliersApi` (chỉ đọc).
- Mọi route mới (nếu có) mặc định CLOSED (ADR-012).

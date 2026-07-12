---
name: procurement
description: Use when sourcing/purchasing EPC materials — turn a BOQ item into a vendor shortlist, RFQ draft, comparison table, and recommendation. Coordination layer only; routes internal vendor lookup to suppliersApi, external vendor search to firecrawl (websearch fallback if IP-blocked), and reuses quotationsApi for existing quotes. Prefers internal suppliers to avoid duplicate data. Does NOT rewrite supplier/quote logic.
---

# Agent: Procurement

Lớp điều phối mua sắm vật tư EPC. Nhận 1 hạng mục, trả về Vendor shortlist + RFQ draft + Comparison + Recommendation theo `workflows/procurement/output-schema.json`. KHÔNG chứa logic mua sắm — chỉ route đến công cụ CÓ SẴN. Chuẩn nghiệp vụ lấy từ tiền lệ RFQ/so sánh báo giá thật ngoài hệ thống (Bulong Alpha, RS Group, CEPRO, Nederman...).

## Input

```json
{
  "itemDescription": "string — mô tả hạng mục (vd: 'bolt/nut/washer ASTM A193/A194')",
  "quantity": "number — số lượng cần mua",
  "specs": "string? — tiêu chuẩn/thông số (vd: 'A193 B7 stud bolt, A194 2H nut, M20, HDG')"
}
```

- `itemDescription` + `quantity` bắt buộc.

## Routing (PHẢI tuân theo)

| bước | công cụ | gọi | ghi chú |
|------|---------|-----|---------|
| 1. Internal check | **suppliersApi** (frontend) / `db.getSuppliers(projectId)` (backend) | `suppliersApi.getAll()` → match `itemDescription` với `supplier.type`/`name` | Ưu tiên NCC nội bộ, tránh duplicate. Chỉ đọc. |
| 2. External search | **firecrawl** (chính) | `firecrawl_search(itemDescription + specs)` → `firecrawl_scrape` trang NCC/datasheet | Nếu firecrawl IP-blocked (đã ghi nhận M2) → `websearch-fallback`. |
| 3. RFQ draft | (tạo từ item + shortlist) | không tool riêng | subject/body/recipients/lineItems. |
| 4. Compare | **quotationsApi** (nếu có báo giá) | `quotationsApi.getAll()` → `db.getSupplierQuotations` | chỉ dùng báo giá THẬT; không bịa giá. |
| 5. Recommend | (logic chọn) | ưu tiên nội bộ nếu khớp | tiêu chí: coverage tiêu chuẩn, chứng nhận, lead time, giá. |

### Quy tắc
- Internal-first: luôn `suppliersApi.getAll()` trước; NCC nội bộ khớp → `source: internal`, KHÔNG search ngoài trùng.
- External chỉ khi nội bộ thiếu. `retrievedVia` = `firecrawl` hoặc `websearch-fallback`.
- Mọi giá/thông số phải từ kết quả thật (trang NCC / báo giá). Thiếu → `'cần RFQ'`.

## Output (khớp output-schema.json)
- `item`, `internalCheck` (đã tra nội bộ chưa, khớp ai), `vendorShortlist[]` (name/source/type/location/standards/matchScore/url/retrievedVia), `rfqDraft`, `comparison[]`, `recommendation` (vendor/reason/alternatives/caveats).
- Mục không có → mảng rỗng `[]` hoặc `'cần RFQ'`. KHÔNG bịa.

## Quy tắc cứng
- KHÔNG sửa `suppliersApi` (chỉ đọc). KHÔNG viết lại logic supplier/quote.
- KHÔNG bịa giá/specs/lead time. Giá luôn `'cần RFQ'` trừ khi có báo giá thật.
- Ưu tiên nội bộ, tránh duplicate data.
- KHÔNG tạo route API mới trong bước này. Nếu cần expose qua UI → báo trước, route mặc định CLOSED (ADR-012).
- Không `console.log`, không dead code.

## Smoke test (tham khảo)
- Input: `{ "itemDescription": "bolt/nut/washer ASTM A193/A194", "quantity": 500, "specs": "A193 B7 stud bolt, A194 2H heavy hex nut, F436 washer, M20, HDG" }`
- Internal check: `suppliersApi.getAll()` → không NCC nội bộ khớp A193/A194 → search ngoài.
- Route → `firecrawl` (API key): ra shortlist NCC thật (Bulong Alpha / Bulong Quang Thai / Saigon Kinh Bac / VETCO), so sánh theo tiêu chuẩn A193/A194, đề xuất Bulong Quang Thai (trang sản phẩm khớp 100% bộ B7 + 2H + F436).
- Xem `agents/procurement/smoke-output.json` (dữ liệu thật từ firecrawl, 2026-07-13).

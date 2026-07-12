# Checklist: Procurement Agent

- [ ] Input có `itemDescription` + `quantity` (bắt buộc); `specs?` có thì dùng.
- [ ] Đã gọi `suppliersApi.getAll()` trước khi search ngoài (internal-first).
- [ ] NCC nội bộ khớp đã được đưa vào shortlist (`source: internal`), không trùng với external.
- [ ] External search qua `firecrawl` (hoặc `websearch-fallback` nếu IP-blocked) — có `url` gốc đối chiếu.
- [ ] `rfqDraft` đủ subject/body/recipients/lineItems.
- [ ] `comparison` đúng schema; `priceIndication` = `'cần RFQ'` nếu chưa có báo giá thật.
- [ ] `recommendation` có `vendor` + `reason` + `caveats`; ưu tiên nội bộ nếu khớp.
- [ ] KHÔNG bịa giá/specs; KHÔNG sửa `suppliersApi`; KHÔNG tạo route mới khi chưa báo ADR-012.
- [ ] Output khớp `workflows/procurement/output-schema.json`.

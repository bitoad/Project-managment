# Checklist: Drawing Analyzer (M6)

- [ ] Đã phân loại input (vector-pdf / scanned-pdf / image / unknown).
- [ ] Vector-pdf → gọi pdf-reader MCP, có `extractedText` + `dimensions[]`.
- [ ] Scanned/image → `objectsDetected: 'BLOCKED'`, note cần OCR.
- [ ] `objectsDetected` LUÔN `'BLOCKED'` (M6 không detect object).
- [ ] KHÔNG bịa rooms/grids/walls/doors/windows/equipment.
- [ ] KHÔNG dùng vision-LLM (GLM-5.2) — ADR-016. KHÔNG cài OCR/CV.
- [ ] KHÔNG tạo route API mới.
- [ ] Output khớp `workflows/drawing-analysis/output-schema.json`.
- [ ] (Smoke test) Bỏ qua — phương án A: không tự sinh PDF giả, template only.

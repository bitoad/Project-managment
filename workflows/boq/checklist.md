# Checklist: BOQ Engineer (M5)

- [ ] Input có `itemCode` (bắt buộc); `quantity` optional (thiếu → dùng item.qty).
- [ ] Đã fetch item qua `itemsApi.get` (name/unit/unitCost/internalCost/unitPrice/drawingCode).
- [ ] `boq[]` đủ code/name/qty/unit.
- [ ] `mto[]` đủ trường, `drawingCode` để rỗng nếu M5 chưa có.
- [ ] `costEstimate` đúng công thức: cost=qty×(internalCost??unitCost), price=qty×unitPrice, profit=price−cost, margin %.
- [ ] KHÔNG đổi unitCost/unitPrice; KHÔNG sửa item; KHÔNG tạo route mới.
- [ ] `scope.manualInput=true`, `scope.drawingData=false` (M6).
- [ ] `review.status=pending`.
- [ ] Output khớp `workflows/boq/output-schema.json`.

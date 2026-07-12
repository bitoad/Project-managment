# Workflow: BOQ / Quantity Takeoff (Workflow #4)

Flow gốc (AI_Platform_7_Workflows.md):
```
Drawing Data ──▶ BOQ Engineer ──▶ Quantity Calculation ──▶ MTO ──▶ Cost Estimate ──▶ Review
```

M5 kích hoạt một phần: từ **BOQ Engineer** trở đi. Phần **Drawing Data** (auto lấy từ bản vẽ) chưa làm được — cần Drawing Analyzer = **M6**.

## Stages

### 1. Drawing Data — [PARTIAL] (M6)
Trích xuất từ bản vẽ. M6 định nghĩa Drawing Analyzer ở dạng router/spec: vector text-PDF → `pdf-reader MCP` lấy text/dimension (ĐƯỢC PHÉP); **object detection [BLOCKED]** (không OCR/CV, vision-LLM hoãn theo ADR-016). Xem `workflows/drawing-analysis/workflow.md`.

### 2. BOQ Engineer — [ACTIVE] (M5)
Agent điều phối (xem `agents/boq-engineer/SKILL.md`). Nhận input thủ công `{itemCode, quantity?}` từ `itemsApi`, tính BOQ + MTO + Cost Estimate theo `output-schema.json`.

### 3. Quantity Calculation — [ACTIVE]
Nhân qty × unit từ item (dữ liệu có sẵn trong `itemsApi`/`db.getItems`).

### 4. MTO — [ACTIVE]
Material Take-Off: vật tư lấy ra từ input thủ công (bản giới hạn). M6 sẽ tự sinh từ Drawing Data.

### 5. Cost Estimate — [ACTIVE]
Tái dùng công thức KPI có sẵn (`db.js`): `cost = Σ qty×(internalCost??unitCost)`, `price = Σ qty×unitPrice`, `profit = price−cost`, `margin = profit/price×100`. KHÔNG đổi công thức.

### 6. Review — [ACTIVE]
Review thủ công (con người / PM). M6 bổ sung Drawing Data để tự động hóa đầu vào.

## Notes
- M5 chỉ đọc `itemsApi` (KHÔNG sửa item). KHÔNG tạo route mới.
- Mọi cost/profit dùng công thức chuẩn — đụng KPI phải approval (AGENTS.md).

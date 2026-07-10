---
name: skill-boq
description: "Trigger khi làm việc với BOQ (Bill of Quantities) — đọc/ghi/validate BOQ_Template.xlsx, tra cứu Item_Master, VLOOKUP SSOT pattern. Xử lý mọi thao tác BOQ."
---

## TRIGGER
- User yêu cầu: "đọc BOQ", "validate BOQ", "cập nhật BOQ", "tạo BOQ mới"
- File liên quan: BOQ_Template.xlsx, Item_Master.xlsx
- Từ khóa: BOQ, bill of quantities, unit rate, lump sum, preliminary

## INPUT SCHEMA (tham chiếu BOQ_Template.xlsx)
```yaml
boq_id: string
project_id: string
items:
  - item_code: string        # Mã từ Item_Master (VLOOKUP SSOT)
    description: string
    unit: string             # m, m2, m3, kg, lot, Sum, Item, Set, Roll, Roll/Rm
    quantity: number
    unit_price: number
    amount: number           # = qty × unit_rate
    remarks: string
```

## OUTPUT FORMAT
```yaml
boq_id: string
validation:
  status: "valid" | "errors" | "warnings"
  errors:
    - item_code: string
      issue: string          # "missing_in_master" | "unit_mismatch" | "duplicate"
      fix: string
  warnings:
    - item_code: string
      issue: string
summary:
  total_items: number
  total_amount: number
  currency: string
  last_updated: datetime
```

## QUY TRÌNH
1. **Read BOQ file** → parse BOQ_Template.xlsx
2. **Validate each item** → check item_code vs Item_Master.xlsx (VLOOKUP SSOT)
3. **Check unit consistency** → unit trong BOQ phải match Item_Master
4. **Flag errors** → item không tồn tại, unit sai, duplicate code
5. **Flag warnings** → quantity bất thường, price outliers (>3 std dev)
6. **Output report** → format chuẩn để TECH hoặc PROC đọc tiếp

## EDGE CASES
| Vertical | Lưu ý |
|----------|-------|
| EPC | BOQincludes Preliminaries (Site Setup, HSE, QA/QC). Unit "Sum" hoặc "Lot" phổ biến |
| FITOUT | BOQ chia theo khu vực (Lobby, Corridor, Unit). Material-heavy |
| RETAIL | BOQ đơn giản hơn, nhiều "Set" (display fixtures). Ít preliminary |
| EVENTS | BOQ theo event package. Nhiều "Item" (one-off). Ít unit rate |

## CHECKLIST
- [ ] Tất cả item_code đều tồn tại trong Item_Master
- [ ] Unit一致 (không có unit lạ)
- [ ] Không duplicate item_code
- [ ] Amount = qty × unit_rate (không sai math)

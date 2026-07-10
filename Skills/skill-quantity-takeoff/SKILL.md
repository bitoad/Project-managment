---
name: skill-quantity-takeoff
description: "Trigger khi cần MTO (Material Takeoff) từ bản vẽ/spec sang line items, gắn mã Item Master. Chuyển đổi bản vẽ thành số lượng vật tư."
---

## TRIGGER
- User yêu cầu: "tính MTO", "takeoff từ bản vẽ", "số lượng vật tư", "material quantity"
- File input: bản vẽ PDF, spec sheet, schedule
- Từ khóa: MTO, takeoff, quantity, material list, BOQ line items

## INPUT
```yaml
project_id: string
vertical: "EPC" | "FITOUT" | "RETAIL" | "EVENTS"
source:                      # Nguồn data
  type: "drawing" | "spec" | "schedule"
  file: string               # Path hoặc reference
discipline: string           # Civil, Structural, M&E, Architectural, Interior
items:
  - description: string
    dimension:                # Kích thước từ bản vẽ
      length: number
      width: number
      height: number
      unit: string
    material_ref: string     # Chủng loại từ spec
```

## OUTPUT FORMAT
```yaml
takeoff_id: string
project_id: string
discipline: string
items:
  - item_code: string        # Gắn từ Item_Master (VLOOKUP)
    description: string
    spec_ref: string         # Ref đến spec/datasheet
    quantity: number
    unit: string
    waste_factor: number     # % hao hụt (thường 5-10%)
    net_quantity: number     # qty × (1 + waste)
    source_drawing: string   # Link bản vẽ gốc
validation:
  items_mapped: number
  items_unmapped: number     # Cần人工 map
  unmapped_items: []         # Items chưa có mã Item_Master
```

## QUY TRÌNH
1. **Parse source** → đọc bản vẽ/spec/schedule
2. **Extract items** → list ra các vật tư cần thiết
3. **Map to Item_Master** → VLOOKUP tìm item_code phù hợp
4. **Calculate quantity** → tính theo dimension + waste factor
5. **Flag unmapped** → items không match Item_Master → cần人工 input
6. **Output** → format chuẩn để BOQ skill đọc tiếp

## EDGE CASES
| Vertical | Lưu ý |
|----------|-------|
| EPC | MTO phức tạp, nhiều discipline. Cần check piping spec, structural steel |
| FITOUT | MTO theo room type. Furniture/Fixture chiếm phần lớn |
| RETAIL | MTO tập trung vào display fixtures, signage. Ít structural |
| EVENTS | MTO临时 structures. Quantity nhỏ nhưng deadline gấp |

## CHECKLIST
- [ ] Tất cả items đều có unit一致
- [ ] Waste_factor hợp lý (5-15% tùy loại)
- [ ] Unmapped items đã được flag
- [ ] Source drawing được reference rõ ràng

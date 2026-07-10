---
name: skill-procurement
description: "Trigger khi cần RFQ generation, so sánh báo giá từ nhà cung cấp, quản lý timeline mua hàng, purchase order. Xử lý mọi quy trình mua sắm."
---

## TRIGGER
- User yêu cầu: "tạo RFQ", "so sánh báo giá", "purchase order", "lead time", "mua hàng"
- Từ khóa: RFQ, quotation, supplier, vendor, PO, procurement, purchase
- File input: BOQ (lấy danh sách items cần mua)

## INPUT
```yaml
project_id: string
action: "create_rfq" | "compare_quotes" | "create_po" | "track_order"
rfq_data:                   # Khi tạo RFQ
  items:
    - item_code: string      # Từ Item_Master/BOQ
      description: string
      quantity: number
      unit: string
      spec_ref: string       # Reference spec/datasheet
  suppliers: []              # Danh sách NCC gửi RFQ
  deadline: date             # Hạn submit báo giá
quote_data:                  # Khi so sánh báo giá
  rfq_id: string
  quotes:
    - supplier_id: string
      items:
        - item_code: string
          unit_price: number
          lead_time_days: number
          moq: number        # Minimum Order Quantity
          payment_terms: string
```

## OUTPUT FORMAT
```yaml
rfq_id: string
project_id: string
created_date: date
deadline: date
items_summary:
  total_items: number
  total_estimated_value: number
  currency: string
comparison:                  # Khi so sánh
  recommended_supplier: string
  reason: string             # "lowest_price" | "best_value" | "fastest_delivery"
  total_savings: number      # So với lowest quote
  risk_notes: []
orders:
  - po_id: string
    supplier_id: string
    items: []
    total_value: number
    expected_delivery: date
    status: "pending" | "confirmed" | "shipped" | "delivered"
```

## QUY TRÌNH
1. **Extract items từ BOQ** → xác định cần mua gì
2. **Check inventory** → có sẵn không, cần mua thêm
3. **Create RFQ** → gửi NCC theo danh sách
4. **Collect quotes** → nhận và validate báo giá
5. **Compare** → so sánh price, lead time, MOQ, payment terms
6. **Recommend** → đề xuất NCC + lý do
7. **Create PO** → nếu approved

## EDGE CASES
| Vertical | Lưu ý |
|----------|-------|
| EPC | Long lead items (steel, MEP equipment). Cần order sớm. Import vs local |
| FITOUT |定制 items (custom furniture). Lead time 6-12 tuần. Sample approval trước |
| RETAIL | Bulk order nhiều stores. Negotiate volume discount |
| EVENTS | Urgent order, ít khi competitive bid. Cash & carry phổ biến |

## CHECKLIST
- [ ] RFQ items match BOQ requirements
- [ ] Đã check minimum 3 suppliers (trừ proprietary)
- [ ] So sánh đầy đủ: price, lead time, MOQ, payment, warranty
- [ ] PO đã approved theo authority matrix

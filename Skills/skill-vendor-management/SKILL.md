---
name: skill-vendor-management
description: "Trigger khi quản lý database nhà cung cấp (NCC), đánh giá performance, lịch sử giao dịch, blacklist/whitelist. Quản lý toàn bộ thông tin NCC."
---

## TRIGGER
- User yêu cầu: "thêm NCC", "đánh giá NCC", "lịch sử giao dịch", "blacklist NCC", "danh sách nhà cung cấp"
- Từ khóa: vendor, supplier, evaluation, performance, blacklist, approved vendor list
- Khi có RFQ/PO cần check NCC history

## INPUT
```yaml
action: "create" | "update" | "evaluate" | "search" | "blacklist"
vendor_data:
  vendor_id: string
  name: string
  category: string           # "Material" | "Equipment" | "Subcon" | "Service"
  specialties: []            # ["Steel", "MEP", "Furniture", ...]
  certifications: []         # ["ISO 9001", "OHSAS 18001", ...]
  contact:
    person: string
    email: string
    phone: string
  financial:
    annual_revenue: number
    credit_terms: string
  performance:               # Khi evaluate
    quality_score: number    # 1-10
    delivery_score: number   # 1-10
    price_competitiveness: number  # 1-10
    responsiveness: number   # 1-10
    safety_record: number    # 1-10
```

## OUTPUT FORMAT
```yaml
vendor_id: string
name: string
status: "approved" | "probation" | "blacklisted" | "inactive"
overall_score: number       # Average of performance scores
transactions:
  total_orders: number
  total_value: number
  on_time_delivery: percent
  quality_rejection_rate: percent
  average_lead_time: number # days
evaluation_history:
  - date: date
    evaluator: string
    scores: {}
    remarks: string
```

## QUY TRÌNH
1. **Search/check** → tìm NCC trong database
2. **Validate** → check certifications, financial stability
3. **Evaluate** → score theo 5 tiêu chí (quality, delivery, price, response, safety)
4. **Update status** → approved/probation/blacklist
5. **Link to transactions** → ghi nhận lịch sử giao dịch
6. **Report** → output cho PROC skill dùng

## EDGE CASES
| Vertical | Lưu ý |
|----------|-------|
| EPC | NCC cần OHSAS/ISO. Safety record quan trọng. Prequalification required |
| FITOUT | NCC furniture thường overseas. Check shipping capabilities |
| RETAIL | NCC signage/fixture. Cần capability cho rollout nhiều stores |
| EVENTS | NCC temporary structures. Ít formal evaluation, cần reference check |

## CHECKLIST
- [ ] Vendor data đầy đủ (contact, certs, financial)
- [ ] Performance scores đã cập nhật
- [ ] Blacklist check trước khi tạo PO
- [ ] Transaction history sync với procurement records

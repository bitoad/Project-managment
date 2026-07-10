---
name: skill-material-submittal
description: "Trigger khi xử lý quy trình submit vật tư (SDRL/VMDL), tracking approval status, material submittal log. Quản lý quy trình phê duyệt vật liệu."
---

## TRIGGER
- User yêu cầu: "tạo submittal", "check status submittal", "SDRL", "VMDL", "phê duyệt vật tư"
- Từ khóa: submittal, SDRL, VMDL, material approval, shop drawing, sample, mock-up
- File input: Material list từ BOQ/MTO, Spec sheets

## INPUT
```yaml
project_id: string
action: "create" | "update_status" | "log" | "report"
submittal_data:
  submittal_id: string
  item_code: string          # Từ Item_Master
  description: string
  type: "SDRL" | "VMDL"      # Shop Drawing / Vendor Drawing / Material
  category: "Shop Drawing" | "Material Sample" | "Mock-up" | "Data Sheet" | "Certificate"
  supplier_id: string
  status: "pending_submit" | "submitted" | "under_review" | "approved" | "revise_resubmit" | "rejected"
  submissions:               # Lịch sử submit
    - revision: number
      date: date
      submitted_by: string
      reviewed_by: string
      status: string
      remarks: string
  approval_validity: date    # Hạn hiệu lực approve
```

## OUTPUT FORMAT
```yaml
project_id: string
summary:
  total_submittals: number
  approved: number
  pending: number
  rejected: number
  overdue: number           # Chưa submit quá hạn
submittals:
  - submittal_id: string
    item_code: string
    category: string
    current_status: string
    days_in_status: number
    next_action: string     # "submit_to_consultant" | "awaiting_approval" | "resubmit"
    urgency: "overdue" | "urgent" | "normal"
log:
  - date: date
    action: string
    by: string
    remarks: string
```

## QUY TRÌNH
1. **Identify items** → từ BOQ/MTO, xác định cần submittal gì
2. **Create submittal** → tạo record với category phù hợp
3. **Track submission** → ngày submit, ai submit
4. **Track approval** → Consultant/Client approve/reject/revise
5. **Update status** → cập nhật SDRL/VMDL log
6. **Alert overdue** → flag items quá hạn submit/approval

## EDGE CASES
| Vertical | Lưu ý |
|----------|-------|
| EPC | SDRL phức tạp, nhiều revision. Approval từ multiple parties (PMC, Client) |
| FITOUT | Mock-up required cho lobby/unit. Approval từ landlord + ID consultant |
| RETAIL | Brand guideline approval từ principal. Quick turnaround (3-5 ngày) |
| EVENTS | Ít formal submittal. Sample approval tại site. Fast-track process |

## CHECKLIST
- [ ] Submittal ID unique
- [ ] Item code match Item_Master
- [ ] Approval validity date set
- [ ] Revision history đầy đủ
- [ ] Overdue items đã flag

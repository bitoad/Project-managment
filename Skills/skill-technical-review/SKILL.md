---
name: skill-technical-review
description: "Trigger khi cần review spec/datasheet, EN 10204 compliance check, technical specification review, equipment data review. Review mọi tài liệu kỹ thuật."
---

## TRIGGER
- User yêu cầu: "review spec", "check compliance", "EN 10204", "technical datasheet", "kiểm tra kỹ thuật"
- Từ khóa: spec, datasheet, compliance, standard, EN, ASTM, BS, review, technical
- File input: Spec sheets, datasheets, technical documents

## INPUT
```yaml
project_id: string
action: "review_spec" | "check_compliance" | "compare_specs" | "validate_data"
review_data:
  document_type: "spec" | "datasheet" | "certificate" | "test_report" | "drawing"
  item_code: string          # Từ Item_Master
  content: {}                # Nội dung spec/datasheet
  applicable_standards: []   # ["EN 10204", "ASTM A36", "BS 546", ...]
  project_requirements: {}   # Spec từ project-specific requirements
```

## OUTPUT FORMAT
```yaml
review_id: string
project_id: string
item_code: string
document_type: string
compliance:
  status: "compliant" | "non_compliant" | "conditional" | "pending_verification"
  score: number              # 0-100%
  issues:
    - standard_ref: string   # "EN 10204 Type 3.1"
      requirement: string
      finding: string
      severity: "critical" | "major" | "minor"
      recommendation: string
recommendations:
  - action: string
    priority: "high" | "medium" | "low"
    deadline: string
approval_status:
  reviewed_by: string
  review_date: date
  approved: boolean
  conditions: []             # Điều kiện nếu conditional approve
```

## QUY TRÌNH
1. **Identify applicable standards** → từ project spec + industry standards
2. **Extract requirements** → list ra các điều kiện cần meet
3. **Compare document** → so sánh content vs requirements
4. **Flag issues** → non-compliant items + severity
5. **Recommend** → suggested actions để comply
6. **Output review** → format chuẩn

## EDGE CASES
| Vertical | Lưu ý |
|----------|-------|
| EPC | Standards phức tạp (EN, ASTM, ASME, API). Multiple certificates needed |
| FITOUT | Fire rating specs, emission standards (VOC). Landlord requirements |
| RETAIL | Brand standards từ principal. Equipment specs cho display |
| Events | Temporary structures — structural calc, wind load, fire safety |

## CHECKLIST
- [ ] Tất cả applicable standards đã identify
- [ ] Mỗi issue có severity + recommendation
- [ ] Compliance score tính đúng
- [ ] Conditions rõ ràng (nếu conditional approve)

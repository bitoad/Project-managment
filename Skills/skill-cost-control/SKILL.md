---
name: skill-cost-control
description: "Trigger khi cần so sánh budget vs actual, cảnh báo vượt chi, tính Earned Value, phân tích cost variance. Monitoring tài chính dự án."
---

## TRIGGER
- User yêu cầu: "kiểm tra chi phí", "budget vs actual", "cost report", "earned value", "cảnh báo vượt chi"
- Từ khóa: cost, budget, variance, EVM, SPI, CPI, forecast, expenditure
- File liên quan: Cost_Log, BOQ (lấy unit rate)

## INPUT
```yaml
project_id: string
action: "report" | "variance" | "evm" | "forecast"
period:                     # Kỳ báo cáo
  start: date
  end: date
cost_data:
  budget: number
  actual_spend: number
  earned_value: number
  planned_value: number
  items:                     # Chi tiết theo cost category
    - category: string       # "Labor" | "Material" | "Equipment" | "Subcon" | "Prelim"
      budget: number
      actual: number
```

## OUTPUT FORMAT
```yaml
project_id: string
period: [start, end]
summary:
  total_budget: number
  total_actual: number
  variance: number           # budget - actual
  variance_percent: number
  status: "under_budget" | "on_budget" | "over_budget"
evm:
  spi: number                # Schedule Performance Index (EV/PV)
  cpi: number                # Cost Performance Index (EV/AC)
  eac: number                # Estimate at Completion (BAC/CPI)
  etc: number                # Estimate to Complete (EAC - AC)
  vac: number                # Variance at Completion (BAC - EAC)
alerts:
  - severity: "critical" | "warning" | "info"
    message: string
    category: string
    action_required: string
by_category:
  - category: string
    budget: number
    actual: number
    variance: number
    trend: "improving" | "stable" | "worsening"
```

## QUY TRÌNH
1. **Collect cost data** → từ Cost_Log + BOQ unit rates
2. **Calculate variance** → budget - actual theo category
3. **Compute EVM metrics** → SPI, CPI, EAC, ETC
4. **Generate alerts** → flag categories >10% over budget
5. **Forecast** → dự báo final cost từ CPI hiện tại
6. **Output report** → format chuẩn

## EDGE CASES
| Vertical | Lưu ý |
|----------|-------|
| EPC | Cost theo discipline. Equipment cost cao. Retention 5-10% |
| FITOUT | Cost theo khu vực. Variance lớn do landlord changes |
| RETAIL | Cost theo store. Rollout nhiều stores cần comparison |
| EVENTS | Cost theo event. Không có retention. Payment milestones khác |

## CHECKLIST
- [ ] Budget number đúng (approved version, không phải draft)
- [ ] Actual spend đã reconcile với finance
- [ ] SPI/CPI tính đúng công thức
- [ ] Alerts đúng ngưỡng (10% warning, 20% critical)

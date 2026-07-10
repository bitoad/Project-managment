---
name: skill-project-manager
description: "Trigger khi user yêu cầu điều phối dự án, phân task cho agent con, tracking milestone, tóm tắt tiến độ tổng thể. Hoạt động như dispatcher chính."
---

## TRIGGER
- User hỏi: "tình trạng dự án", "phân task", "milestone sắp tới", "tóm tắt tiến độ"
- Có yêu cầu điều phối giữa nhiều agent (DOC, TRACK, COMM, TECH, PROC)
- Cần tổng hợp output từ các skill khác thành report thống nhất

## INPUT
```yaml
project_id: string          # Mã dự án
action:                     # "status" | "dispatch" | "milestone" | "summary"
vertical: "EPC" | "FITOUT" | "RETAIL" | "EVENTS"
agents_needed: []           # Danh sách agent con cần dispatch
context:                    # Tùy action
  milestone_id: string
  date_range: [start, end]
```

## OUTPUT FORMAT
```yaml
project_id: string
status: "on_track" | "at_risk" | "delayed"
milestones:
  - id: string
    name: string
    due: date
    progress: percent
    owner_agent: string
tasks_dispatched:
  - agent: "DOC" | "TRACK" | "COMM" | "TECH" | "PROC"
    task: string
    priority: "high" | "medium" | "low"
    deadline: date
summary: string              # 1-3 câu tóm tắt
risks: []                    # Các rủi ro cần attention
```

## QUY TRÌNH
1. **Đọc project context** → fetch project data từ DB/file
2. **Xác định vertical** → EPC/FITOUT/RETAIL/EVENTS ảnh hưởng logic
3. **Phân tích milestone** → so sánh due date vs hiện tại
4. **Dispatch task** → gán task cho agent con phù hợp
5. **Compile output** → tổng hợp thành format chuẩn

## EDGE CASES THEO VERTICAL
| Vertical | Lưu ý |
|----------|-------|
| EPC | Milestone theo phase (Design→Procure→Construct→Commission). Pipeline dài 12-24 tháng |
| FITOUT | Milestone theo khu vực (Floor→Unit→Common). Phụ thuộc landlord schedule |
| RETAIL | Deadline cứng theo store opening date. Không extend được |
| EVENTS | Timeline ngắn (2-8 tuần). Milestone theo tuần, không theo tháng |

## CHECKLIST TRƯỚC KHI DONE
- [ ] Có đủ project_id, vertical, action
- [ ] Output đúng format schema
- [ ] Task đã dispatch đúng agent
- [ ] Risks đã liệt kê (nếu có)

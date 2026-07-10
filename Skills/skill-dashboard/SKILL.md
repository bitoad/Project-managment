---
name: skill-dashboard
description: "Trigger khi tạo/sửa dashboard, KPI chart, S-Curve, Gantt chart, hoặc bất kỳ visualization component nào trong React."
---

## TRIGGER
- Từ khóa: "dashboard", "chart", "KPI", "S-Curve", "Gantt", "graph", "visualization"
- File: React component render data visualization
- Cần render data từ API thành chart/graph

## STACK
- Charting: Recharts (ưu tiên) hoặc Chart.js
- Gantt: dhtmlx-gantt hoặc custom SVG
- Layout: Ant Design Grid (Row/Col)

## CONVENTIONS
- Component naming: `KpiCard`, `CostChart`, `GanttTimeline`
- File location: `src/components/dashboard/`
- Data fetching: dùng Context hoặc hook, không inline fetch
- Responsive: dùng `%` hoặc `flex`, không固定px width
- Color: dùng theme token từ Ant Design, không hardcode hex

## WORKFLOW
1. **Define data shape** → xác định API response format
2. **Create component** → functional component + hook
3. **Render chart** → Recharts component với responsive container
4. **Handle loading** → Skeleton/Spinner khi fetch data
5. **Handle error** → Empty state hoặc error boundary

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Data empty | Hiển thị "No data" thay vì blank |
| Data large (>1000 points) | Aggregate hoặc paginate |
| Real-time update | Use WebSocket hoặc polling interval |
| Export chart | Use Recharts `ref` + html2canvas |

## CHECKLIST
- [ ] Component responsive trên mobile/tablet
- [ ] Loading state có
- [ ] Error state có
- [ ] Color consistent với theme
- [ ] No hardcoded data (tất cả từ API/props)

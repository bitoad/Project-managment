# REDESIGN BRIEF — PM Dashboard UI/UX

## ROLE
Bạn là Senior Product Designer + Frontend Architect (top 0.01%), chuyên
redesign B2B SaaS dashboard (Linear, Vercel, Ramp, Notion-level polish).

## CONTEXT
PM Dashboard hiện tại (React 18 + Vite + AntD 5 + Recharts) đang ở mức
"functional MVP" — đúng nhưng chưa "best in class". Vấn đề cụ thể:

### ISSUE 1 — Visual hierarchy phẳng
Tất cả card cùng 1 white bg, cùng border-radius, cùng shadow → mắt không biết
nhìn đâu trước. Số liệu quan trọng (SPI/CPI, tiến độ %) không có visual weight
tương xứng.

**SOLUTION:** Thiết lập rõ 3 tầng elevation (hero card > metric card >
list/table), typography scale rõ ràng (12/14/16/24/32px), color-code theo mức
độ nghiêm trọng nhất quán (đỏ=risk, cam=warning, xanh lá=on-track).

**ACTION:** Tạo `src/styles/design-tokens.css`:
- Spacing scale: 4/8/12/16/24/32/48px
- Elevation: shadow-sm/md/lg cùng 1 light source
- Typography: font-weight 500/600/700 cho số liệu, 400 cho label
- Border-radius nhất quán: 8px (card), 6px (button/badge), 4px (input)

### ISSUE 2 — Sidebar dark graphite nhưng content area vẫn AntD default
theme.css đã có dark graphite nhưng chưa apply xuống content zone → cảm giác
2 app ghép lại.

**SOLUTION:** Đồng bộ 1 design language duy nhất — content area giữ nền sáng
nhưng accent color, border, hover state phải khớp sidebar palette.

**ACTION:** Extract màu chủ đạo từ sidebar làm `--color-primary`, áp dụng cho
active states, chart lines, badge accent, button primary.

### ISSUE 3 — Chart S-Curve trống/phẳng
Biểu đồ Kế hoạch vs Thực tế chỉ là 2 đường mảnh trên nền trắng trơn.

**SOLUTION:** Thêm area-fill gradient dưới đường, annotation tại điểm lệch
(variance), tooltip rich hơn (kèm delta vs kế hoạch, không chỉ %).

**ACTION:** Refactor `ProjectProgressChart` → Recharts AreaChart thay
LineChart, thêm ReferenceLine cho ngày hiện tại, custom tooltip component.

### ISSUE 4 — Bảng "Hiệu suất theo cảng/gói thầu" là dữ liệu thô
SPI/CPI hiển thị số trần, khó scan nhanh cảng nào risk.

**SOLUTION:** Thêm micro-visualization inline (sparkline / colored dot + số),
sort mặc định theo risk giảm dần.

**ACTION:** Thêm cột "Risk Score" tổng hợp từ SPI+CPI, badge màu thay vì chỉ
text "Chậm"/"Đúng tiến độ".

### ISSUE 5 — Thiếu empty/loading state tử tế
"Chưa có dữ liệu chi phí" chỉ là icon + text, không có CTA.

**SOLUTION:** Mọi empty state cần: icon, câu giải thích ngắn, 1 CTA rõ ràng
("+ Thêm chi phí đầu tiên").

**ACTION:** Tạo shared component `<EmptyState icon title description action />`
dùng lại toàn app.

## CONSTRAINT KỸ THUẬT
- Giữ nguyên stack: React 18 + Vite + AntD 5 + Recharts (không thêm
  Tailwind/Next.js)
- Không phá vỡ auth gate (ADP-012) và withWriteLock (ADR-011)
- Giữ nguyên cấu trúc route/component hiện có, chỉ refactor UI layer
- Desktop-first (PM dùng laptop), mobile-responsive không bắt buộc

## DELIVERABLE — theo milestone
- **M1:** Design tokens + color system (1 file, review trước khi tiếp tục)
- **M2:** Card/Badge/Button component library chuẩn hóa
- **M3:** Dashboard page refactor (hero card → metric grid → chart → table)
- **M4:** Empty/loading/error states toàn app
- **M5:** QA pass — screenshot before/after từng module

Sau mỗi milestone, dừng lại, show diff/screenshot để confirm trước khi sang
milestone tiếp theo. Không tự ý làm hết 1 lần.

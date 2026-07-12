# Workflow: pre-merge-check

> **Orchestrator: ACTIVE (M8)** — điều phối bởi Project Manager agent (`agents/project-manager/SKILL.md`).

Chạy "Architecture Review Checklist" (đã có sẵn `ARCHITECTURE.md`, mục *Architecture Review Checklist*) + kiểm tra build/chất lượng TRƯỚC khi merge.
Mục tiêu: chặn các lỗi lẽ ra checklist bắt được (vd blank page do sai thứ tự hook, route overlap, lost update...).

## Bước tuần tự

- [ ] **1. Xem phạm vi thay đổi** — `git status` + `git diff` (staged/unstaged). Xác nhận mọi dòng đổi đều truy vết được về yêu cầu; không có sửa lung tung ngoài task.
- [ ] **2. Architecture Review Checklist (ARCHITECTURE.md)** — Xác nhận từng mục:
  - [ ] Architecture preserved
  - [ ] Layer separation maintained (db.js ↔ server.js ↔ api.js ↔ pages)
  - [ ] No duplicated business logic
  - [ ] API consistency maintained (không đổi endpoint/response shape/field)
  - [ ] Database integrity preserved (không xóa data ngầm, không đổi schema)
  - [ ] No unnecessary dependencies (thêm dep = cần duyệt, theo Non-Goals)
  - [ ] No circular imports
  - [ ] Components remain reusable
  - [ ] Existing functionality preserved (không regression)
  - [ ] Project remains scalable
- [ ] **3. KPI / Business rules** — Nếu diff chạm KPI (Budget, Planned/Actual Cost, Profit, Progress, SPI, CPI, Schedule, Risk) hoặc entity core → xác nhận CÓ approval; nếu không → chặn merge.
- [ ] **4. Data-safety (ADR-011)** — Nếu có thao tác ghi `data.json`: dùng cơ chế write-lock/`save()` sẵn có, không tạo đường ghi mới gây race/lost-update.
- [ ] **5. Build & runtime** — `npm run build` phải xanh. Không lỗi import/runtime.
- [ ] **6. Vệ sinh code** — Không hardcode, không `console.log`, không dead code/unused import do change này tạo ra. Dead code có sẵn từ trước → flag, không tự xóa.
- [ ] **7. Smoke UI (nếu đổi UI)** — Login + mở các page bị ảnh hưởng, 0 lỗi console (Playwright MCP nếu có).
- [ ] **8. Kết luận** — Xem `checklist.md`. Nếu bất kỳ mục FAIL → KHÔNG merge, báo lại.

## Ràng buộc
- Chỉ đọc + verify; workflow này KHÔNG sửa code nghiệp vụ.
- Không tự merge; chỉ báo cáo GO / NO-GO kèm lý do.

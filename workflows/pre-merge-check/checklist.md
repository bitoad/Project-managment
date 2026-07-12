# Checklist DONE: pre-merge-check

Kết luận merge = **GO** chỉ khi TẤT CẢ mục PASS. Bất kỳ FAIL → **NO-GO**.

## Phạm vi
- [ ] Mọi dòng trong `git diff` truy vết được về yêu cầu; không sửa ngoài task.

## Architecture Review Checklist (ARCHITECTURE.md)
- [ ] Architecture preserved
- [ ] Layer separation maintained
- [ ] No duplicated business logic
- [ ] API consistency (không đổi endpoint/response shape/field)
- [ ] Database integrity (không xóa data ngầm / không đổi schema)
- [ ] No unnecessary dependencies
- [ ] No circular imports
- [ ] Components reusable
- [ ] Existing functionality preserved
- [ ] Project remains scalable

## Business & Data
- [ ] Không chạm KPI/business rule, HOẶC có approval rõ ràng.
- [ ] Ghi `data.json` dùng write-lock/`save()` sẵn có (ADR-011), không gây race.

## Build & chất lượng
- [ ] `npm run build` xanh, không lỗi import/runtime.
- [ ] Không hardcode / `console.log` / dead code / unused import do change tạo ra.
- [ ] Đặt tên & style nhất quán với code cũ.

## UI (nếu áp dụng)
- [ ] Smoke các page ảnh hưởng: 0 lỗi console, không regression.

## Kết luận
- [ ] Ghi rõ **GO** / **NO-GO** + lý do.
- [ ] Nếu NO-GO: liệt kê mục FAIL + file cần sửa.

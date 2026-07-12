# Checklist DONE: add-new-page

Chỉ coi là DONE khi tất cả PASS.

## Backend
- [ ] `db.js`: có đủ method CRUD cần thiết; đọc/ghi qua `ensureDb()`/`save()`; không đổi schema entity cũ.
- [ ] `server.js`: mọi route có `requireProject`/`requireAuth`; POST/PUT có `validateBody`; status code đúng (201/400/404).
- [ ] Không route trần thiếu gate.

## Frontend
- [ ] `api.js`: hàm gọi endpoint mới, đúng convention; không sửa hàm cũ.
- [ ] `src/pages/<Name>.jsx`: functional + hooks + Antd; có loading + error handling; giữ theme.
- [ ] `App.jsx`: lazy import + `<Route>` nằm **trong** `<ProtectedLayout>`.
- [ ] `AppLayout.jsx`: menu item đúng nhóm; `key` === route path.

## Chất lượng (theo AGENTS.md)
- [ ] `npm run build` thành công, không lỗi import/runtime.
- [ ] Không hardcode, không logic trùng, không `console.log`, không dead code / unused import.
- [ ] Đặt tên nhất quán; không đổi endpoint/response shape module cũ.

## Verify chạy thật
- [ ] Login → điều hướng tới `/<path>` OK (không bị đá về /login sai).
- [ ] CRUD hoạt động; dữ liệu lưu đúng `database/projects/<id>/data.json`.
- [ ] 0 lỗi console (kiểm bằng Playwright MCP nếu có).
- [ ] Không regression các page khác.

## Kết thúc
- [ ] Tóm tắt file đã đổi.
- [ ] Commit gợi ý: `feat: add <resource> page (API + model + route gate + menu)`.

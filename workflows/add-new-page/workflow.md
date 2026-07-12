# Workflow: add-new-page

Chuẩn hóa các bước khi thêm 1 page/module mới vào Project-Management (EPC ERP).
Mục tiêu: không bỏ sót bước nào — đặc biệt là **gate route** và **đăng ký menu** (đã từng suýt quên).

> Full-stack chain thật của project: `database/db.js` → `server.js` → `src/api/api.js` → `src/pages/*.jsx` → `src/App.jsx` (gate) → `src/layout/AppLayout.jsx` (menu).

## Bước tuần tự

- [ ] **1. Xác định requirement & entity** — Tên resource (số nhiều, ví dụ `materials`), các field, quan hệ với entity sẵn có (Ports/Items/...). Nếu là business logic/KPI mới → CHỜ DUYỆT (theo AGENTS.md, không tự bịa công thức EPC).
- [ ] **2. Data layer (`database/db.js`)** — Thêm method theo pattern hiện có: `getX(projectId)`, `addX(projectId, data)`, `updateX(projectId, id, data)`, `deleteX(projectId, id)`. Đọc/ghi qua cơ chế `ensureDb()`/`save()` sẵn có, thao tác trên `data.json`. KHÔNG đổi schema entity cũ, KHÔNG xóa dữ liệu ngầm.
- [ ] **3. API routes (`server.js`)** — Thêm CRUD theo đúng pattern:
  ```js
  app.get('/api/<resource>', requireProject, (req, res) => res.json(db.getX(req.projectId)));
  app.post('/api/<resource>', requireProject, validateBody({ name: 'string' }), (req, res) => res.status(201).json(db.addX(req.projectId, req.body)));
  app.put('/api/<resource>/:id', requireProject, validateBody({ name: { type: 'string', required: false } }), (req, res) => ...);
  app.delete('/api/<resource>/:id', requireProject, (req, res) => ...);
  ```
  - Middleware bắt buộc: `requireProject` (dữ liệu theo project) hoặc `requireAuth` (global). KHÔNG để route trần không gate.
  - `validateBody(...)` cho mọi POST/PUT. JSON nhất quán, status code đúng (201 create, 404 not found, 400 validation).
- [ ] **4. API client (`src/api/api.js`)** — Thêm hàm axios gọi endpoint mới, theo đúng convention (base URL, header token) đang dùng. KHÔNG đổi tên/định dạng response của hàm cũ.
- [ ] **5. Page component (`src/pages/<Name>.jsx`)** — Functional component + hooks + Ant Design. Tái sử dụng component/card/table sẵn có. Giữ theme (`colorPrimary #2F5CE0`, borderRadius 16). Xử lý loading (`Spin`) + error (`message`).
- [ ] **6. GATE ROUTE (`src/App.jsx`)** — ⚠️ Bước dễ quên:
  - Thêm `const <Name> = lazy(() => import('./pages/<Name>.jsx'));`
  - Thêm `<Route path="/<path>" element={<<Name> />} />` **BÊN TRONG** `<Route element={<ProtectedLayout />}>` (khối gate, dòng ~65). Đặt ngoài khối này = page không được bảo vệ auth.
- [ ] **7. Menu sidebar (`src/layout/AppLayout.jsx`)** — Thêm `{ key: '/<path>', icon: <Icon />, label: '...' }` vào đúng nhóm (`grp-main` / `grp-project` / `grp-cost` / `grp-resources` / `grp-report`). `key` phải trùng `path` ở App.jsx.
- [ ] **8. Verify** — Xem `checklist.md`.

## Ràng buộc
- Chỉ thêm code cho đúng yêu cầu; không thêm feature suy đoán.
- Không đổi endpoint/response shape/field của module cũ.
- Không đụng code nghiệp vụ khác (Ports/Auth) trừ khi task yêu cầu.

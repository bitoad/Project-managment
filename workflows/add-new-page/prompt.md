# Prompt mẫu: add-new-page

Copy prompt dưới, điền `{{...}}`, gửi cho Hy3.

---

Chạy workflow `workflows/add-new-page/workflow.md` để thêm page mới.

**Resource**: `{{ten_resource_so_nhieu}}`  (vd: materials)
**Route path**: `/{{path}}`  (vd: /materials)
**Tên page**: `{{TenPage}}`  (vd: Materials)
**Nhóm menu**: `{{grp-...}}`  (grp-main | grp-project | grp-cost | grp-resources | grp-report)
**Label menu**: `{{nhan_hien_thi}}`
**Fields của entity**: `{{liet_ke_field + kieu du lieu}}`
**Quan hệ**: `{{lien ket voi Ports/Items/... hoac doc lap}}`
**CRUD cần có**: `{{GET / POST / PUT / DELETE}}`
**Gate**: requireProject (mặc định) | requireAuth

Yêu cầu:
- Đi đúng 8 bước trong workflow.md, KHÔNG bỏ bước gate route (App.jsx) và menu (AppLayout.jsx).
- Bám pattern code sẵn có (db.js / server.js / api.js). Không đổi response shape module cũ.
- Nếu có business logic/KPI mới → DỪNG hỏi trước khi code.
- Xong thì chạy `checklist.md` và báo cáo pass/fail từng mục + tóm tắt file đã đổi.

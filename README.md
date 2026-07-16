# 🛢️ Oil & Gas Project Management App

Ứng dụng Web nội bộ quản lý **nhiều dự án dầu khí** — tạo dự án, import dữ liệu từ Excel, dashboard theo dõi tiến độ/chi phí/rủi ro, xuất báo cáo PDF/Excel.

**Golden Point Co., Ltd × PTSC M&C (via Hà Quang)**

---

## 🚀 Khởi động nhanh

```bash
# Cài đặt (chỉ lần đầu)
npm install

# Chạy ứng dụng (frontend + backend cùng lúc)
npm run dev
```

Mở trình duyệt tại: **http://localhost:5173**

- Frontend (Vite dev): http://localhost:5173
- Backend API: http://localhost:3001

---

## ✨ Tính năng chính

### 🏗️ Đa dự án (Multi-Project)
- **Dropdown chọn dự án** ở header → chuyển nhanh giữa các dự án
- Mỗi dự án có **file dữ liệu riêng** (`database/projects/<id>/data.json`)
- Tạo / sửa / xóa dự án

### 📊 Import / Export Excel
- **Import**: Upload file `.xlsx` (11 sheets) → app tự đọc & nạp dữ liệu
  - `ITEM_MASTER` → Items
  - `COST_LOG` → Cost Logs
  - `TASK_LIST` → Tasks (Kanban)
  - `SUPPLIER_QUOTATION` → Báo giá 3 NCC
  - `S_CURVE` → Đường cong tiến độ
  - `REGISTRATION LIST` → Nhân sự team
  - `SETTING` / `PORT_SUMMARY` → Cấu hình
- **Export**: Xuất toàn bộ dữ liệu dự án ra `.xlsx`

### 📋 13 trang chức năng
| Trang | Chức năng |
|-------|-----------|
| Dashboard | KPI, biểu đồ, rủi ro ưu tiên |
| Quản lý Dự án | Tạo/chọn dự án, import/export Excel |
| Ports | 7 gói thầu (PORT 1-7) |
| Item Master | CRUD hạng mục (BOQ) |
| Kanban | Kéo thả 4 cột công việc |
| Risk Matrix | Heatmap 5×5 + bảng rủi ro |
| Cost Log | Theo dõi chi phí thực tế |
| Quotations | So sánh báo giá 3 NCC |
| S-Curve | Đường cong Earned Value (SPI) |
| Suppliers | Nhà cung cấp |
| Documents | Upload bản vẽ, MTO, BOM |
| Team | Nhân sự & phân công |
| Reports | Xuất 5 loại báo cáo PDF |

---

## 🔄 Luồng sử dụng

### Tạo dự án mới + nhập dữ liệu
1. Vào **Quản lý Dự án** → "Tạo dự án mới"
2. Nhập tên → bấm **Import** cạnh dự án
3. Chọn file Excel → dữ liệu nạp tự động
4. Mở **Dashboard** xem kết quả

### Nhập tay (form web)
1. Chọn dự án ở dropdown header
2. Vào trang cần thêm (Items, Cost Log, Kanban, Team...)
3. Bấm **+ Thêm** → điền form → Lưu

### Xuất báo cáo cho sếp
- **PDF**: Vào trang **Báo cáo** → chọn loại → tải PDF
- **Excel**: Vào **Quản lý Dự án** → bấm **Export** cạnh dự án

---

## 🏗️ Kiến trúc

```
Frontend:  React 18 + Ant Design 5 + Recharts + Vite
Backend:   Node.js + Express.js
Database:  JSON file (mỗi dự án 1 file)
PDF:       jsPDF + jspdf-autotable
Excel:     xlsx (SheetJS)
```

```
project-management-app/
├── server.js                      # Backend Express
├── database/
│   ├── db.js                      # Logic CRUD đa dự án
│   ├── seed-data.json             # Template dự án mới
│   └── projects/
│       ├── _index.json            # Danh sách dự án
│       └── <projectId>/data.json  # Dữ liệu từng dự án
├── src/
│   ├── App.jsx                    # Routing
│   ├── index.jsx                  # Entry + ProjectProvider
│   ├── api/api.js                 # API client
│   ├── context/ProjectContext.jsx # State dự án hiện tại
│   ├── layout/AppLayout.jsx       # Sidebar + ProjectSelector
│   ├── components/helpers.js      # Hàm tiện ích
│   └── pages/                     # 13 trang
└── package.json
```

---

## 💡 Ghi chú

- Dữ liệu lưu trong JSON, **an toàn khi khởi động lại**
- Lần đầu chạy: tự migrate `data.json` cũ → `projects/block-b-gas/`
- Toàn bộ giao diện **Tiếng Việt**
- Để reset dữ liệu 1 dự án: Sửa dự án → "Reset dữ liệu"
# Apple Inspired Design System Analysis

Design system details have been moved to: https://getdesign.md/apple/design-md

You can also view previews, dark mode examples, and download options on getdesign.md.
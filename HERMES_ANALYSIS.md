# Hướng dẫn phân tích project bằng Hermes Agent

## Cấu hình đã thiết lập
- **Model**: Qwen 3.5:9B (Ollama)
- **Context window**: 16384 tokens
- **Temperature**: 0.3 (phân tích chính xác)
- **Working dir**: project-management-app

## Cách chạy Hermes Agent

### Mở terminal tại thư mục project:
```bash
cd C:\Users\Admin\ZCodeProject\project-management-app
hermes
```

## Các prompt phân tích mẫu

### 1. Phân tích tổng quan project
```
Phân tích toàn bộ project này: kiến trúc, cấu trúc, technologies sử dụng, ưu/nhược điểm
```

### 2. Phân tích code chất lượng
```
Đọc và phân tích tất cả file trong thư mục src/pages. Tìm bug, lỗi logic, code trùng lặp, và đề xuất cải thiện
```

### 3. Phân tích security
```
Phân tích file server.js và database/db.js. Tìm các lỗ hổng bảo mật (SQL injection, XSS, CSRF...) và đề xuất fix
```

### 4. Phân tích API
```
Đọc file src/api/api.js và server.js. Liệt kê tất cả API endpoints, method, parameters, và đánh giá thiết kế API
```

### 5. Phân tích database
```
Đọc tất cả file trong thư mục database/. Phân tích schema, đánh giá thiết kế database, tìm vấn đề về data integrity
```

### 6. Phân tích frontend
```
Đọc file App.jsx, AppLayout.jsx, và tất cả components. Đánh giá UI/UX, component structure, state management
```

### 7. Code review cụ thể
```
Review file [tên_file]. Giải thích từng phần code, tìm bug tiềm ẩn, đề xuất refactor
```

### 8. Tìm và fix bug
```
Tìm tất cả console.log trong src/, phát hiện code chưa dọn dẹp, hard-coded values cần config
```

## Lưu ý với Qwen 3.5:9B
- Model 9B rất tốt cho phân tích code cơ bản - trung bình
- Với project lớn, nên phân tích từng phần/từng file thay vì toàn bộ cùng lúc
- Nếu model trả lời không chính xác, hãy chia nhỏ câu hỏi hơn
- Context 16384 tokens ≈ đọc ~20 file JS/JSX cùng lúc

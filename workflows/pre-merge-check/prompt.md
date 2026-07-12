# Prompt mẫu: pre-merge-check

Copy prompt dưới, gửi cho Hy3 trước khi merge.

---

Chạy workflow `workflows/pre-merge-check/workflow.md` cho thay đổi hiện tại.

**Branch / phạm vi**: `{{ten branch hoac mo ta thay doi}}`
**Merge vào**: `{{main | ...}}`

Yêu cầu:
- Đọc `git status` + `git diff`, duyệt đủ Architecture Review Checklist (ARCHITECTURE.md).
- Kiểm tra: KPI/business rule có bị chạm không (cần approval), data-safety (ADR-011), `npm run build`, vệ sinh code, smoke UI nếu đổi UI.
- KHÔNG tự sửa code nghiệp vụ, KHÔNG tự merge.
- Kết luận **GO** hoặc **NO-GO**; nếu NO-GO liệt kê rõ mục FAIL + file liên quan.

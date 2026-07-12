# Prompt mẫu: document-research

Copy prompt dưới, điền `{{...}}`, gửi cho Hy3.

---

Chạy workflow `workflows/document-research/workflow.md` để tra cứu tài liệu kỹ thuật.

**Nhu cầu**: `{{mô tả vật liệu/thiết bị/tiêu chuẩn cần tra, vd: sơn Jotun Facade 1403 datasheet}}`
**Loại nguồn**: `{{datasheet | standard | catalogue}}` (có thể nhiều, cách bởi dấu phẩy)
**Dự án áp dụng** (nếu có): `{{tên project}}`

Yêu cầu:
- Dùng agent `agents/document-researcher/` để route đúng MCP (datasheet/catalogue→firecrawl, standard→context7 + firecrawl fallback). KHÔNG viết lại logic search.
- Output khớp `workflows/document-research/output-schema.json`: điền đúng mảng datasheets/catalogues/standards, kèm `url` gốc, viết `technicalSummary` tiếng Việt.
- Không bịa thông số — mọi giá trị phải từ kết quả MCP.
- Xong thì chạy `checklist.md` và báo cáo pass/fail + tóm tắt kết quả.

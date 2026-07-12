# 7 Workflow AI Platform — Trạng thái đối chiếu thật (cập nhật theo Phase 2)

> Dùng file này để đối chiếu khi làm bất kỳ milestone nào tiếp theo — không dùng bản gốc AI_Platform_7_Workflows.md một mình vì nó chưa phản ánh tiến độ thật.

| # | Workflow | Agent chính | Trạng thái | Milestone |
|---|---|---|---|---|
| 1 | Build Web App | Software Engineer | ✅ ACTIVE | M3 |
| 2 | Technical Document Research | Document Researcher | ✅ ACTIVE (có AI Search page trong web app) | M2 |
| 3 | Drawing Analysis | Drawing Analyzer | 🔶 ĐANG KHẢO SÁT — chưa xác định khả thi | M6 (đang chạy, chờ báo cáo Bước 1-2) |
| 4 | BOQ / Quantity Takeoff | BOQ Engineer | 🔶 PARTIAL — chỉ phần Quantity Calculation → Cost Estimate, chưa có input tự động từ bản vẽ | M5 |
| 5 | Procurement | Procurement Agent | ✅ ACTIVE | M4 |
| 6 | Report Generation | Report Writer | ✅ ACTIVE | M1 |
| 7 | Website Cloner & UI/UX | Website Cloner + UI Designer | ⛔ CHƯA BẮT ĐẦU — chờ duyệt khảo sát overlap (Next.js vs Vite stack hiện tại) | M7 |

## Ghi chú quan trọng cho Hy3

- **Workflow #3 và #4 liên kết nhau:** M5 (BOQ) đã làm PHẦN SAU của Workflow #4 (từ dữ liệu có sẵn), M6 (Drawing Analyzer) khi xong sẽ bổ sung PHẦN ĐẦU (Drawing Data → tự động). Đến khi M6 xong, Workflow #4 mới coi là ACTIVE đầy đủ.
- **Workflow #7 chưa mở** — không code gì cho Website Cloner/UI Designer cho đến khi có quyết định rõ về Next.js vs Vite.
- **Master Orchestrator (Project Manager agent)** chưa build — đây là M8, làm SAU CÙNG khi ≥2 agent đã ACTIVE thật (hiện đã đủ điều kiện vì có 4 agent ACTIVE: Report Writer, Document Researcher, Software Engineer, Procurement).

## Đối chiếu ADR/quyết định liên quan

- ADR-011: JSON write-lock (ảnh hưởng mọi agent ghi dữ liệu)
- ADR-012: Auth gate — mọi route API mới của agent phải qua gate này, không tạo route mở
- Firecrawl: đã có API key thật trong `.env` (`FIRECRAWL_API_KEY`) — Document Researcher & Procurement dùng firecrawl thật (`retrievedVia: firecrawl`), đã test OK. Fallback DuckDuckGo vẫn giữ cho máy không có key. (Ghi chú "IP-blocked" ở M2 chỉ áp dụng cho firecrawl MCP phía assistant, không phải HTTP path server-side.)

## Cách dùng file này

Trước khi bắt đầu bất kỳ milestone nào (M6, M7, M8...), đọc bảng trên để biết chính xác agent nào đã ACTIVE, agent nào chưa — tránh giả định sai hoặc làm trùng việc đã có.


# Workflow: document-research

Chuẩn hóa flow tra cứu tài liệu kỹ thuật (datasheet / catalogue / standard) cho dự án EPC.
Tái sử dụng MCP có sẵn: `context7` (docs kỹ thuật) và `firecrawl` (web search + scrape vendor).
Output khớp `output-schema.json`.

> Dùng cho nhu cầu thật: tra thông số vật liệu/thiết bị (vd: sơn Jotun Facade 1403), tiêu chuẩn áp dụng, catalogue nhà cung cấp.

## Bước tuần tự

- [ ] **1. Tiếp nhận yêu cầu** — Lấy `query` (câu hỏi/nhu cầu) và `sources` ∈ {`datasheet`, `standard`, `catalogue`}.
- [ ] **2. [ACTIVE] Document Researcher (lớp điều phối)** — Gọi agent `agents/document-researcher/` với input `{query, sources}`. Agent tự route:
  - `datasheet` / `catalogue` → **firecrawl** (`firecrawl_search` + scrape)
  - `standard` → **context7** (docs kỹ thuật) chính, **firecrawl** fallback (web)
  - Agent KHÔNG viết lại logic search — chỉ gọi đúng MCP. Chi tiết: `agents/document-researcher/SKILL.md`.
- [ ] **3. Chuẩn hóa kết quả theo `output-schema.json`** — Điền `datasheets` / `catalogues` / `standards` tương ứng; thiếu mục để mảng rỗng `[]`, không bịa.
- [ ] **4. Viết `technicalSummary`** — Tóm tắt tiếng Việt: sản phẩm là gì, thông số chính, chứng nhận, lưu ý chọn/ứng dụng.
- [ ] **5. Verify** — Xem `checklist.md`.

## Ràng buộc

- Chỉ gọi MCP có sẵn (context7 / firecrawl). Không viết lại logic search.
- Không bịa thông số — mọi giá trị phải từ kết quả MCP (có `url` nguồn).
- Giữ `url` gốc để người dùng đối chiếu.
- Nếu firecrawl bị chặn (IP/key), agent báo lỗi rõ ràng, không tự bịa kết quả.
- Không `console.log`, không dead code.

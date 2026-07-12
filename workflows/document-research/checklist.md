# Checklist DONE: document-research

## Input
- [ ] `query` rõ ràng; `sources` ∈ {datasheet, standard, catalogue} đã xác định.

## Routing (Document Researcher)
- [ ] `datasheet` / `catalogue` → firecrawl.
- [ ] `standard` → context7 chính, firecrawl fallback.
- [ ] Agent KHÔNG viết lại logic search — chỉ gọi đúng MCP.

## Output (output-schema.json)
- [ ] Có `query`, `sources`, `technicalSummary`.
- [ ] `datasheets` / `catalogues` / `standards` đúng mảng theo `sources` (mục không có → `[]`).
- [ ] Mỗi ref có `title`, `source`, `url` (gốc, đối chiếu được).
- [ ] `technicalSummary` tiếng Việt, súc tích, đúng với kết quả.
- [ ] Không bịa thông số; mọi giá trị có nguồn MCP.

## Chất lượng
- [ ] Chỉ dùng context7 / firecrawl; không thêm dependency search mới.
- [ ] Nếu firecrawl bị chặn → báo lỗi rõ, không tự bịa.
- [ ] Không `console.log`, không dead code.

## Verify chạy thật
- [ ] Có kết quả thực tế (ít nhất 1 ref có `url` mở được).
- [ ] `technicalSummary` khớp nội dung các ref.

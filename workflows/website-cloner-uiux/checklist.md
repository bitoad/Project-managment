# Checklist: Website Cloner & UI Designer (M7)

- [ ] `url` là public (không localhost / IP nội bộ / domain công ty / `.local` / `file://`).
- [ ] Extract bằng Playwright DOM (không screenshot, không vision-LLM).
- [ ] Có `extractedStructure` (tagCounts / classes / texts).
- [ ] `component.jsx` là pure React + Tailwind; `framework: 'react+vite'`.
- [ ] KHÔNG có syntax Next.js (`next/image`, App Router, `getServerSideProps`...).
- [ ] KHÔNG copy asset/images bản quyền.
- [ ] KHÔNG thêm framework/thư viện vào project.
- [ ] `.jsx` validate qua esbuild (hợp lệ).
- [ ] Output khớp `workflows/website-cloner-uiux/output-schema.json`.
- [ ] `deferred` ghi rõ pixel-perfect (cần vision).

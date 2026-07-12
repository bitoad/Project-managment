---
name: website-cloner-uiux
description: Use when cloning a PUBLIC website into a pure React + Tailwind component for the Vite+React stack (NO Next.js). Combined Cloner + UI Designer in one pipeline: extracts HTML/CSS structure via Playwright DOM (no vision-LLM, no screenshot analysis), maps it to a functional React component with Tailwind utility classes and design tokens. Refuses internal/company URLs, never copies copyrighted assets/images. Visual pixel-perfect fidelity deferred (needs vision). Spec/coordination layer — does not add frameworks.
---

# Agent: Website Cloner & UI Designer (bản giới hạn M7)

Lớp clone website public → React component thuần (Vite). Gộp 2 vai **Cloner** (trích cấu trúc) + **UI Designer** (ánh xạ → component/Tailwind/design tokens) trong 1 pipeline. KHÔNG sinh code Next.js.

## Input

```json
{
  "url": "string — CHỈ website PUBLIC (http(s)://...). KHÔNG dùng cho URL nội bộ/công ty."
}
```

- `url` bắt buộc, phải là public.

## Routing / Quy trình (PHẢI tuân theo)

| bước | công cụ | ghi chú |
|------|---------|---------|
| 0. Guard | (nội bộ) | Từ chối nếu url là localhost / IP nội bộ / domain công ty / `.local` / `file://`. Chỉ public. |
| 1. Extract | **Playwright** (DOM, KHÔNG screenshot) | `page.content()` / `$$eval` lấy tag hierarchy, classes, inline styles, text. KHÔNG cần vision-LLM. |
| 2. UI Designer map | (model transform) | Ánh xạ cấu trúc → functional React component + Tailwind classes + design tokens (tham chiếu Ant Design có sẵn). |
| 3. Emit | (viết file `.jsx`) | `export default function Clone()` — pure React + Tailwind. KHÔNG Next.js. |

### Quy tắc
- Chỉ DOM extraction → **KHÔNG dùng vision-LLM** (GLM-5.2). Public site = rủi ro data-egress thấp, nhưng đường DOM không cần vision nên sidestep ADR-016.
- Output thuần `.jsx` + Tailwind utilities. Cấm: `next/image`, App Router (`app/`), `getServerSideProps`, `getStaticProps`, `'use client'` (không dùng Next).
- **KHÔNG copy asset/images có bản quyền** từ nguồn. Dùng `<img>` placeholder rỗng hoặc bỏ qua; chỉ lấy cấu trúc + text (vd example.com là public domain).

## Output (khớp output-schema.json)
- `url`, `publicChecked`, `extractedStructure` (tagCounts / classes / texts), `component: { fileName, jsx, framework: 'react+vite' }`, `deferred: ['pixel-perfect visual fidelity (needs vision)']`, `notes`.

## Quy tắc cứng
- KHÔNG sinh Next.js (bất kỳ hình thức).
- KHÔNG dùng vision-LLM khi chưa rõ phân biệt rủi ro (ở đây dùng DOM → không cần).
- KHÔNG copy asset/images bản quyền.
- KHÔNG thêm framework/thư viện mới vào project (Tailwind chỉ dùng trong component sinh ra, không cài vào app chính).
- Không `console.log`, không dead code.

## Smoke test (M7)
- Input: `{ "url": "https://example.com" }` (public domain).
- Extract → 1 div / h1 / 2 p / a. Map → `ExampleClone` (.jsx + Tailwind).
- Verify: esbuild transform JSX → hợp lệ. Xem `smoke-example.jsx` + `smoke-output.json`.

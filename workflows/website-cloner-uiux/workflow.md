# Workflow: Website Cloner + UI/UX (Workflow #7)

> **Orchestrator: ACTIVE (M8)** — điều phối bởi Project Manager agent (`agents/project-manager/SKILL.md`).

Flow gốc (theo file AI_Platform_7_Workflows.md): Website Cloner → sinh React/Next.js/Tailwind component → UI Designer.
M7 giới hạn: KHÔNG sinh Next.js — chỉ React thuần + Tailwind (stack Vite+React hiện tại).

```
Website Cloner ──▶ UI Designer ──▶ React Component (Vite) ──▶ Verify
   (DOM extract)    (map→Tailwind)   (.jsx pure)          (esbuild/Playwright)
```

## Stages

### 1. Website Cloner — [PARTIAL] (M7)
Agent `website-cloner-uiux`: guard URL public → Playwright DOM extract (tag hierarchy / classes / inline styles / text). KHÔNG screenshot-vision, KHÔNG vision-LLM (ADR-016 spirit; public = low egress, nhưng đường DOM không cần vision).

### 2. UI Designer — [PARTIAL] (M7)
Ánh xạ cấu trúc → functional React component + Tailwind utility classes + design tokens. Tham chiếu Ant Design có sẵn (ARCHITECTURE) làm convention; output dùng Tailwind (standalone).

### 3. React Component (Vite) — [ACTIVE] (M7)
Output `.jsx` pure React + Tailwind. **KHÔNG Next.js** (`next/image`, App Router, `getServerSideProps`...). KHÔNG copy asset bản quyền.

### 4. Verify — [PARTIAL] (M7)
esbuild JSX syntax check (xác nhận hợp lệ). Playwright render có thể làm trong sandbox Vite+Tailwind tách biệt (app chính CHƯA có Tailwind → không cài thêm nếu chưa duyệt).

## Notes
- Visual pixel-perfect fidelity (cần vision-LLM) → **deferred**.
- KHÔNG thêm framework vào project; Tailwind chỉ nằm trong component sinh ra.
- Nguyên tắc "không copy asset bản quyền" được ghi rõ trong SKILL.md.

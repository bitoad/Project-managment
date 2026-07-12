---
name: software-engineer
description: Use when implementing a web-app feature/bugfix/refactor for the EPC ERP (React + Express + JSON). Encapsulates the real end-to-end process Hy3 follows — read related code, plan, implement minimally reusing existing modules, verify (build/lint/test/UI smoke), commit by convention (feat/fix/docs), and emit a short Technical Report. This is a process agent (not a routing layer); it documents the established workflow so the Project Manager orchestrator can invoke it as a unit.
---

# Agent: Software Engineer

Định nghĩa lại quy trình phát triển web app THẬT TẾ (đang do Hy3 thực hiện trực tiếp qua chat) thành SKILL có cấu trúc, để Project Manager orchestrator (M8) sau này gọi như 1 agent. KHÔNG bịa quy trình mới — mọi bước dưới đây lấy từ `AGENTS.md`, `ADR-011…ADR-015`, và các task đã làm từ ADR-011 đến nay (gồm cả AI Search page vừa xong).

## Input

```json
{
  "task": "string — mô tả yêu cầu từ User/PM (feature/bug/refactor)",
  "constraints": ["string? — ràng buộc tường minh, ví dụ: không chạm 13 page cũ, không rebuild logic search"],
  "references": ["string? — file/ADR cần đối chiếu, ví dụ: ADR-012, agents/document-researcher"]
}
```

- `task` bắt buộc.
- `constraints` / `references` optional nhưng nên có nếu task nhạy cảm (data-safety, auth, KPI).

## Process (CHÍNH XÁC quy trình đã làm thật)

### B1. Triage & Read (đọc trước khi sửa)
- Đọc `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md` liên quan.
- Tra codebase: search/grep tìm module/pattern CÓ SẴN (api, context, component, util). Đọc convention file đích trước khi sửa.
- Xác định công cụ/endpoint/trang tái sử dụng — KHÔNG viết lại logic đã có.
- Nếu yêu cầu mơ hồ / nhiều cách hiểu → DỪNG, nêu giả định, hỏi PM.

### B2. Plan (chỉ khi đổi kiến trúc / business rule / UI / breaking)
- Giải thích plan, chờ duyệt. Với task thường ngày (theo convention) → bỏ qua, làm thẳng.

### B3. Implement (tối thiểu, đúng convention)
- Chỉ sửa đúng những gì task yêu cầu; match style file hiện tại; reuse module.
- KHÔNG thêm framework mới, KHÔNG đổi endpoint/response shape, KHÔNG drop field, KHÔNG redesign UI chưa hỏi.
- KHÔNG hardcode, KHÔNG duplicate logic, KHÔNG `console.log`, KHÔNG dead code.
- Data-safety: ghi `data.json` qua write-lock/`save()` sẵn có (ADR-011).
- API write: validate body/query qua `validate.js` (ADR-015, non-breaking).
- Auth: route mới mặc định CLOSED — `POST/PUT/DELETE` qua token gate (ADR-012); thêm `requireAuth` nếu cần.

### B4. Verify (bắt buộc trước khi gọi xong)
- `npm run build` phải pass (không import/runtime error).
- Lint/typecheck nếu project có (theo AGENTS.md).
- Regression: không gãy API/trang cũ. Nếu đổi UI → smoke trình duyệt (Playwright khi khả dụng): login → điều hướng → thao tác → check HTTP + DOM.
- Không commit secret/key/password; không để `console.log`/dead code.

### B5. Git Commit (theo convention đã dùng)
- Conventional commits, type ∈ {feat, fix, docs, style, test, refactor, chore}; message tiếng Anh, mô tả rõ, tham chiếu milestone/ADR nếu có.
- Commit nhỏ, thường xuyên; chỉ stage đúng file task (loại trừ noise line-ending, artifact tạm).
- CHỈ push khi được yêu cầu. KHÔNG tự push.

### B6. Technical Report (output ngắn)
- Tóm tắt: đã tạo/sửa gì, test ra sao (build/UI), commit/push chưa. KHÔNG bịa kết quả.

## Hard Rules (từ AGENTS.md + ADR)
- KPI / business rule EPC: KHÔNG đổi khi chưa duyệt.
- Data-safety (ADR-011): không tạo đường ghi `data.json` mới gây race.
- Auth (ADR-012): mọi `POST/PUT/DELETE` cần token; route mới mặc định CLOSED.
- Non-breaking (ADR-015): validate input, không phá response cũ.
- Minimum code cho đúng yêu cầu; không speculative feature.

## Output
- **Technical Report** ngắn (Markdown) gửi PM/User: changed files, verification result, commit hash/push state.
- (Không có JSON schema cố định — output là báo cáo tự nhiên.)

## Proof-of-process: map với task thật (AI Search page — Phase 2 M2)
Task input: "Tạo trang AI Search (page 14) reuse Document Researcher agent; backend POST /api/research/query CLOSED; không chạm 13 page cũ".

| Bước SKILL | Việc ĐÃ LÀM thật |
|---|---|
| B1 Read | Đọc `requireAuth` (server.js:78), global gate POST/PUT/DELETE, ADR-012 trong `DECISIONS.md:265`, `authApi` (api.js), `App.jsx` lazy/route, `AppLayout.jsx` menu, `Reports.jsx` (jsPDF), `agents/document-researcher/SKILL.md`. |
| B2 Plan | Trình bày plan (route CLOSED + reuse agent + in-session history); user duyệt → làm. |
| B3 Implement | Thêm `POST /api/research/query` (requireAuth, CLOSED) vào server.js; `researchApi.query` vào api.js; tạo `src/pages/AISearch.jsx`; route `/ai-search` + menu "AI Search" (RobotOutlined) vào App.jsx/AppLayout.jsx; note ADR-012 vào DECISIONS.md. Không đổi 13 page cũ, không rebuild logic search. |
| B4 Verify | `npm run build` pass; Playwright E2E PASS (login → /ai-search → query "Jotun Facade 1403" → HTTP 200, 15 link nguồn thật). Phát + sửa 3 bug thực tế: authApi path double-`/api` (→`/auth/login`), thiếu import `Avatar`, `ref={r}` reserved prop (→`item={r}`). Revert `users.json`, dọn artifact. |
| B5 Commit | `feat: AI Search chat page + Document Researcher agent (Phase 2 M2)` + `fix: authApi...`; stage đúng file, loại trừ `database/...` line-ending noise. Push khi user duyệt. |
| B6 Report | Báo cáo ngắn: files changed, test PASS, commit + push `main`. |

→ SKILL.md mô tả ĐÚNG thực tế (không bịa): mọi bước B1–B6 khớp 1:1 với cách Hy3 đã làm AI Search page.

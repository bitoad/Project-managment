# Workflow: Build Web App

> **Orchestrator: ACTIVE (M8)** — điều phối bởi Project Manager agent (`agents/project-manager/SKILL.md`).

Pipeline chuẩn để phát triển tính năng web app (React + Vite + Ant Design + Express + JSON storage), orchestrated bởi **Project Manager** và thực thi bởi **Software Engineer** agent.

```
User ──▶ Project Manager ──▶ Software Engineer ──▶ Technical Report ──▶ User
                                  │
                                  ├─(nội bộ)─ Code Review   (ADR-015, pre-merge-check)
                                  ├─(nội bộ)─ Test          (build / lint / UI smoke)
                                  └─(nội bộ)─ Git Commit    (feat/fix/docs convention)
```

## Stages

### 1. User — [ACTIVE]
Cung cấp yêu cầu: feature / bug / refactor (issue, chat, hoặc spec). Không cần định dạng cố định.

### 2. Project Manager — [ACTIVE]
- Đọc `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md` (ADR-011…ADR-015), `ROADMAP.md`.
- Tra codebase hiện tại, tái sử dụng module có sẵn.
- Nếu yêu cầu mơ hồ / nhiều cách hiểu → hỏi lại, nêu giả định (không đoán).
- Tách task nhỏ; giao **Software Engineer** qua `task description` có cấu trúc (xem `agents/software-engineer/SKILL.md` → Input).
- Ghi nhận quyết định / thay đổi ADR nếu có.

### 3. Software Engineer — [ACTIVE]
Agent thực thi toàn bộ quy trình phát triển. Xem chi tiết tại `agents/software-engineer/SKILL.md`.
Thực hiện nội bộ các cổng chất lượng:
- **Code Review** — non-breaking (ADR-015), data-safety (ADR-011), vệ sinh code, không secret (tham khảo `workflows/pre-merge-check/`).
- **Test** — `npm run build`, lint/typecheck, regression, Playwright nếu đổi UI.
- **Git Commit** — conventional commits (`feat`/`fix`/`docs`/`style`/`test`/`refactor`/`chore`), commit nhỏ, không commit secret/key.
- **Technical Report** — tóm tắt ngắn những gì đã đổi, trả về cho PM/User.

### 4. Technical Report — [ACTIVE]
Báo cáo kết quả (đã đổi gì, test ra sao, commit/push) cho User/PM. KHÔNG bịa kết quả.

## Notes
- Mọi ghi `data.json` phải qua write-lock/`save()` sẵn có (ADR-011) — không route ghi mới gây race.
- Mọi `POST/PUT/DELETE` backend phải qua token gate (ADR-012); route mới mặc định CLOSED.
- Không đổi công thức KPI / business rule EPC khi chưa duyệt (AGENTS.md).

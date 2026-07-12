# Workflow: Drawing Analysis (Workflow #4 — bước Drawing Data)

> **Orchestrator: ACTIVE (M8)** — điều phối bởi Project Manager agent (`agents/project-manager/SKILL.md`).

Phần **Drawing Data** của flow BOQ:
```
Drawing Data ──▶ BOQ Engineer ──▶ Quantity Calculation ──▶ MTO ──▶ Cost Estimate ──▶ Review
```
M6 kích hoạt Drawing Data ở dạng **router/spec giới hạn** (theo khảo sát Bước 1-2).

## Stages

### 1. Drawing Data — [PARTIAL] (M6)
Agent `drawing-analyzer` (router/spec):
- Vector text-PDF → `pdf-reader MCP` lấy text/dimension (đường text-extraction ĐƯỢC PHÉP).
- Scanned/image PDF → **[BLOCKED]** (cần OCR, chưa cài/chưa duyệt).
- **Object detection** (Rooms/Levels/Grids/Doors/Windows/Walls/Equipment) → **[BLOCKED]** (không OCR/CV; vision-LLM GLM-5.2 bị hoãn do data-egress, xem ADR-016).
- KHÔNG bịa kết quả; output template theo `output-schema.json`.

### 2. BOQ Engineer — [ACTIVE] (M5)
Nhận `Drawing Data` (khi có) hoặc input thủ công. Xem `agents/boq-engineer/SKILL.md`.

## Notes
- M6 KHÔNG code phần object-detection. Chỉ định nghĩa routing + template.
- `pdf-reader MCP` là assistant-only MCP (reference routing, không gọi từ Node).
- Vision-LLM (GLM-5.2 image) bị hoãn — ADR-016 (cần đánh giá bảo mật trước khi bật).
- KHÔNG tạo route API mới.

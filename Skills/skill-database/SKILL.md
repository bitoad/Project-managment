---
name: skill-database
description: "Trigger khi thiết kế schema, migration, query pattern cho database. Hiện tại dùng JSON, chuẩn bị migrate sang SQLite/PostgreSQL."
---

## TRIGGER
- Từ khóa: "schema", "database", "migration", "query", "model", "table"
- Task: tạo/sửa data model, chạy migration, tối ưu query
- File: schema files, migration scripts, model definitions

## CURRENT STATE
- Storage: JSON files (database/projects/*/data.json)
- Future: SQLite → PostgreSQL
- ORM: Chưa quyết định (Sequelize/Knex/Prisma)

## SCHEMA CONVENTIONS
- Naming: snake_case cho tables/columns, PascalCase cho models
- ID: UUID hoặc auto-increment integer
- Timestamps: `created_at`, `updated_at` (ISO string hoặc unix timestamp)
- Soft delete: `deleted_at` thay vì hard delete
- Foreign key: `{table}_id` pattern

## WORKFLOW
1. **Define entity** → xác định fields + types + relationships
2. **Create schema** → draft JSON structure hoặc SQL CREATE
3. **Validate** → check constraints, indexes, relationships
4. **Migrate** → script transform data cũ sang format mới
5. **Test** → verify CRUD operations

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Schema change | Migration script + rollback plan |
| Large dataset | Batch processing, pagination |
| Concurrent access | File locking hoặc DB transaction |
| Data integrity | Validation rules + constraints |

## CHECKLIST
- [ ] Schema documented (field name, type, description)
- [ ] Relationships defined (1:1, 1:N, N:M)
- [ ] Indexes cho frequently queried fields
- [ ] Migration script tested
- [ ] Rollback plan exists

---
name: skill-api
description: "Trigger khi thiết kế REST API endpoint — request/response schema, routing, documentation. Quản lý toàn bộ API layer."
---

## TRIGGER
- Từ khóa: "endpoint", "API design", "REST", "request schema", "response format"
- Task: tạo/sửa API endpoint, define request/response contract
- File: route files, API documentation

## REST CONVENTIONS
| Method | Action | Example |
|--------|--------|---------|
| GET | Read | `/api/projects` |
| POST | Create | `/api/projects` |
| PUT | Update (full) | `/api/projects/:id` |
| PATCH | Update (partial) | `/api/projects/:id` |
| DELETE | Remove | `/api/projects/:id` |

## RESPONSE FORMAT (STANDARD)
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "total": 100 },
  "error": null
}
```

## NAMING CONVENTIONS
- Routes: `/api/{resource}` (plural, kebab-case)
- Parameters: `:id`, `:projectId`
- Query: `?page=1&limit=20&sort=created_at&order=desc`
- Nested: `/api/projects/:id/tasks` (max 2 levels deep)

## WORKFLOW
1. **Define resource** → xác định entity + CRUD operations
2. **Design schema** → request body + query params + response shape
3. **Implement route** → mount + controller + validation
4. **Document** → OpenAPI/Swagger hoặc inline comment
5. **Test** → curl/Postman với valid + invalid data

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Pagination | `?page=&limit=` với default limit |
| Filtering | `?status=active&vertical=EPC` |
| Search | `?q=search+term` |
| Bulk operations | POST `/api/{resource}/bulk` |

## CHECKLIST
- [ ] HTTP method đúng với action
- [ ] Response format consistent
- [ ] Error responses có message rõ ràng
- [ ] Input validation on all mutations
- [ ] Pagination on list endpoints

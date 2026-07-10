---
name: skill-express
description: "Trigger khi code backend Express — route, controller, middleware, error handling. Convention cho Express layer."
---

## TRIGGER
- File: `server.js`, route files, controller files
- Từ khóa: "API", "route", "controller", "middleware", "endpoint"
- Task: tạo/sửa backend endpoint hoặc middleware

## FILE STRUCTURE
```
server.js               # Entry point, middleware setup
src/
  routes/              # Route definitions
  controllers/         # Business logic
  middleware/          # Custom middleware
  models/              # Data models (tạm dùng JSON, sau dùng DB)
  utils/               # Helper functions
```

## CODING RULES
- Router: Express Router, mount trong server.js
- Naming: kebab-case cho routes (`/api/projects`), camelCase cho code
- Response format: `{ success: boolean, data: any, error?: string }`
- Status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Error
- Error handling: dùng ErrorBoundary middleware, không try-catch rải

## MIDDLEWARE PATTERN
```javascript
// Standard middleware signature
const middleware = (req, res, next) => {
  // logic
  next();
};
```

## WORKFLOW
1. **Define route** → method + path + middleware chain
2. **Create controller** → business logic, không mixed với route
3. **Add validation** → validate req.body/params/query
4. **Handle errors** → throw hoặc next(error)
5. **Test** → curl hoặc Postman

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Async error | Use try-catch trong async handlers |
| File upload | Use multer middleware |
| Large payload | Set body limit, use streaming |
| CORS | Configure appropriately cho dev/prod |

## CHECKLIST
- [ ] Response format consistent `{ success, data, error }`
- [ ] Proper HTTP status codes
- [ ] Error handling middleware exists
- [ ] No secrets hardcoded
- [ ] Input validation on all endpoints

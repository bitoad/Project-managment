---
name: skill-authentication
description: "Trigger khi implement auth flow, role-based access (PM/Site/Admin), JWT/session management. Quản lý xác thực và phân quyền."
---

## TRIGGER
- Từ khóa: "login", "auth", "JWT", "role", "permission", "session", "token"
- Task: tạo/sửa auth flow, middleware phân quyền
- File: auth routes, middleware, login components

## AUTH FLOW
```
Login → Validate credentials → Generate JWT → Client stores token
     → Attach token to requests → Middleware verify → Grant/Deny access
```

## ROLES (PROJECT)
| Role | Permissions |
|------|------------|
| Admin | Full access (CRUD all resources, manage users) |
| PM | Manage projects, assign tasks, approve budget |
| Site Engineer | Update progress, submit material, view-only budget |
| Procurement | Manage POs, RFQs, vendor database |
| Viewer | Read-only access |

## JWT CONVENTIONS
- Secret: từ environment variable, KHÔNG hardcode
- Expiry: 24h access token, 7d refresh token
- Payload: `{ userId, email, role, projectId }`
- Header: `Authorization: Bearer <token>`

## WORKFLOW
1. **Login endpoint** → POST `/api/auth/login` → return JWT
2. **Protect routes** → middleware verify JWT trước controller
3. **Role check** → middleware check role vs required permission
4. **Refresh token** → POST `/api/auth/refresh` khi token gần hết
5. **Logout** → client delete token (server-side blacklist optional)

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Token expired | Return 401, client redirect to login |
| Invalid token | Return 401, clear stored token |
| Role insufficient | Return 403, message "Access denied" |
| Concurrent sessions |允许多设备登录, hoặc limit sessions |

## CHECKLIST
- [ ] JWT secret từ env variable
- [ ] Token expiry configured
- [ ] Password hashed (bcrypt, KHÔNG plain text)
- [ ] Protected routes have auth middleware
- [ ] Role-based access checked on sensitive operations

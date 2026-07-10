---
name: skill-react
description: "Trigger khi code frontend React — component creation, state management, hooks, routing. Convention cho React layer."
---

## TRIGGER
- File: `.jsx`, `.tsx`, component files
- Từ khóa: "component", "hook", "state", "props", "render", "page"
- Task: tạo/sửa UI component hoặc page

## STACK & CONVENTIONS
- Framework: React + Vite
- UI Library: Ant Design
- State: Context API (global), useState/useReducer (local)
- Routing: React Router v6
- HTTP: Axios

## FILE STRUCTURE
```
src/
  components/       # Reusable components
  pages/            # Route-level components
  context/          # Global state (AuthContext, ProjectContext)
  layout/           # Layout wrappers
  api/              # API service functions
  assets/           # Static files
```

## CODING RULES
- Functional components ONLY (không class component)
- Hooks: useState, useEffect, useCallback, useMemo, useRef
- Props: destructuring trong function signature
-命名: PascalCase cho components, camelCase cho functions/variables
- Export: named export (không default export trừ page components)

## WORKFLOW
1. **Check existing** → search component có sẵn chưa
2. **Create component** → functional + hooks
3. **Add to route** → nếu là page, add vào route config
4. **Test** → render check visual + console error

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Deep prop drilling | Dùng Context hoặc组合 component |
| Re-render performance | React.memo + useCallback |
| Form handling | Ant Design Form + Form.Item |
| Modal/Form | Controlled mode với visible + onFinish |

## CHECKLIST
- [ ] Component name PascalCase
- [ ] No inline styles (dùng Ant Design hoặc CSS module)
- [ ] No console.log trong production
- [ ] PropTypes hoặc TypeScript interface defined

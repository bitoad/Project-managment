---
name: skill-deployment
description: "Trigger khi build/deploy app — env config, build pipeline, rollback plan, production setup. Quản lý deployment process."
---

## TRIGGER
- Từ khóa: "deploy", "build", "production", "environment", "config", "rollback"
- Task: build app, configure environment, deploy, rollback
- Files: `vite.config.js`, `.env*`, `package.json` scripts

## ENVIRONMENT FILES
```
.env                # Default (KHÔNG commit)
.env.local          # Local overrides (gitignore)
.env.development    # Dev environment
.env.production     # Prod environment
```

## BUILD COMMANDS
```bash
npm run dev          # Local development (Vite + backend)
npm run build        # Production build → dist/
npm run preview      # Preview build locally
npm start            # Production server (if applicable)
```

## WORKFLOW
1. **Check env** → verify all required env vars set
2. **Run tests** → ensure no failing tests
3. **Build** → `npm run build`
4. **Verify build** → `npm run preview` hoặc deploy to staging
5. **Deploy** → upload dist/ hoặc docker build
6. **Verify prod** → smoke test key features
7. **Rollback plan** → có plan B nếu có issue

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Build fails | Check errors, fix, rebuild |
| Env missing | Check .env files, set defaults |
| Large bundle | Code splitting, lazy loading |
| Cache issues | Clear dist/, rebuild from scratch |

## CHECKLIST
- [ ] Environment variables configured
- [ ] Build succeeds without warnings
- [ ] Bundle size acceptable (<500KB gzipped)
- [ ] No hardcoded URLs/keys trong build
- [ ] Rollback plan documented
- [ ] Smoke test checklist准备

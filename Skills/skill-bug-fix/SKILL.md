---
name: skill-bug-fix
description: "Trigger khi debug/fix bug — reproducible steps, root cause analysis, fix, regression test. Quy trình debug chuẩn hóa."
---

## TRIGGER
- Từ khóa: "bug", "error", "fix", "debug", "broken", "issue", "lỗi"
- Task: fix bất kỳ lỗi nào (runtime, build, visual, logic)
- Error messages, stack traces, console logs

## QUY TRÌNH DEBUG (4 BƯỚC)
1. **Reproduce** → tạo steps để lặp lại bug
2. **Isolate** → tìm root cause (file, line, logic)
3. **Fix** → minimal change để fix (không refactor lung tung)
4. **Verify** → test fix + check regression

## OUTPUT FORMAT
```yaml
bug_id: string
title: string
severity: "critical" | "high" | "medium" | "low"
status: "investigating" | "fixing" | "testing" | "resolved"
repro_steps:
  - "Step 1: ..."
  - "Step 2: ..."
root_cause: string
affected_files: []
fix_applied: string
verified: boolean
regression_check: string
```

## WORKFLOW
1. **Gather info** → error message, screenshot, steps to reproduce
2. **Reproduce** → chạy lại để confirm bug
3. **Search code** → grep/search relevant code
4. **Isolate root cause** → debug, add console.log, check data flow
5. **Apply fix** → minimal change
6. **Verify** → test fix function
7. **Check regression** → ensure fix doesn't break other features
8. **Document** → log bug + fix trong comments hoặc commit message

## EDGE CASES
| Loại bug | Xử lý |
|----------|-------|
| Build error | Check dependencies, import paths, syntax |
| Runtime error | Check console, network tab, API response |
| Visual bug | Check CSS, responsive, theme |
| Data bug | Check API response, state management, DB query |

## CHECKLIST
- [ ] Bug reproducible steps documented
- [ ] Root cause identified
- [ ] Fix is minimal (không over-engineering)
- [ ] Fix tested trên multiple browsers/devices
- [ ] No regression introduced
- [ ] Commit message rõ ràng (fix: ...)

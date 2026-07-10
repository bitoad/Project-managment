---
name: skill-testing
description: "Trigger khi viết/sửa test — unit test, integration test, coverage checklist. Quản lý toàn bộ testing strategy."
---

## TRIGGER
- Từ khóa: "test", "unit test", "integration test", "coverage", "mock", "assert"
- Task: viết test, chạy test, fix test, xem coverage
- File: `*.test.js`, `*.spec.js`, `__tests__/`

## TEST CONVENTIONS
- Framework: Jest (backend) + React Testing Library (frontend)
- File naming: `{filename}.test.js` hoặc `__tests__/{filename}.test.js`
- Structure: `describe() → it() → expect()`
- Mock: jest.mock() cho external dependencies
- Coverage threshold: 80% (statements, branches, functions, lines)

## TEST PYRAMID
```
        /  E2E  \          少量
       /----------\
      / Integration \      适量
     /--------------\
    /    Unit Test    \     大量
   /------------------\
```

## WORKFLOW
1. **Identify test cases** → positive, negative, edge cases
2. **Write test** → arrange-act-assert pattern
3. **Mock dependencies** → external API, DB, filesystem
4. **Run test** → `npm test`
5. **Check coverage** → ensure threshold met
6. **Fix failures** → debug and fix test or code

## EDGE CASES
| Loại test | Xử lý |
|-----------|-------|
| Async code | Use async/await, done callback |
| API test | Mock axios/fetch, test response handling |
| Component test | Render, simulate events, assert DOM |
| Database test | In-memory DB hoặc mock, không dùng prod DB |

## CHECKLIST
- [ ] Test files co-located với source
- [ ] Test cả happy path + error cases
- [ ] Mock external dependencies
- [ ] Coverage >= 80%
- [ ] No flaky tests (deterministic)
- [ ] Test names descriptive (it('should ...'))

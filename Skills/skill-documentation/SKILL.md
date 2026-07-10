---
name: skill-documentation
description: "Trigger khi viết doc code + doc nghiệp vụ, changelog format, API documentation. Quản lý documentation standards."
---

## TRIGGER
- Từ khóa: "doc", "documentation", "README", "changelog", "API doc", "guide"
- Task: viết/sửa documentation cho code hoặc business logic
- Files: `*.md`, `docs/`, `CHANGELOG.md`, inline comments

## DOCUMENTATION TYPES
| Type | Location | Purpose |
|------|----------|---------|
| README | Root `README.md` | Project overview, setup guide |
| Code doc | Inline comments | Explain complex logic |
| API doc | `docs/api/` | Endpoint documentation |
| Business doc | `docs/business/` | SOP, workflows, decisions |
| Changelog | `CHANGELOG.md` | Version history |

## CHANGELOG FORMAT
```markdown
## [1.2.0] - 2026-07-10
### Added
- Feature X for project management
### Changed
- Updated BOQ validation logic
### Fixed
- Bug fix for cost calculation
### Removed
- Deprecated feature Y
```

## WORKFLOW
1. **Identify need** → what needs documenting
2. **Gather info** → read code, talk to stakeholders
3. **Write draft** → clear, concise, actionable
4. **Review** → accuracy, clarity, completeness
5. **Publish** → commit, update related docs

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Code outdated | Update doc simultaneously với code |
| Complex logic | Use diagrams + examples |
| Multiple audiences | Separate docs cho dev vs business |
| API changes | Update changelog + API doc simultaneously |

## CHECKLIST
- [ ] Doc clear và concise (không rườm rà)
- [ ] Examples included cho complex concepts
- [ ] Code snippets tested (không broken examples)
- [ ] Links working (internal + external)
- [ ] Changelog follows format

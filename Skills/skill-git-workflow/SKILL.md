---
name: skill-git-workflow
description: "Trigger khi làm việc với git — branch naming, commit convention, PR checklist, merge strategy. Quản lý Git workflow."
---

## TRIGGER
- Từ khóa: "git", "branch", "commit", "PR", "merge", "rebase"
- Task: tạo branch, commit, push, tạo PR, merge
- Files: `.git/`, any code changes

## BRANCH NAMING
```
feature/{ticket-id}-{short-description}    # New feature
fix/{ticket-id}-{short-description}        # Bug fix
hotfix/{ticket-id}-{short-description}     # Urgent prod fix
release/{version}                          # Release branch
chore/{description}                        # Maintenance
```

## COMMIT CONVENTION (CONVENTIONAL COMMITS)
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat(boq): add BOQ validation endpoint
fix(cost): correct earned value calculation
docs(api): update project endpoints documentation
```

## PR CHECKLIST
- [ ] Code compiles/builds
- [ ] Tests pass
- [ ] No console.log trong production code
- [ ] Code review self-checked
- [ ] Related docs updated
- [ ] Changelog updated (nếu applicable)

## WORKFLOW
1. **Create branch** → từ latest main/develop
2. **Make changes** → code + test
3. **Commit** → clear message theo convention
4. **Push** → `git push origin feature/xxx`
5. **Create PR** → description + review request
6. **Review** → self-review + peer review
7. **Merge** → squash merge hoặc rebase

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Merge conflict | Resolve manually, rebase trước khi push |
| Broken build | Revert hoặc hotfix, KHÔNG force push |
| Large PR | Split thành smaller PRs |
| WIP commit | Use `git stash` hoặc draft PR |

## CHECKLIST
- [ ] Branch name follows convention
- [ ] Commit messages clear và descriptive
- [ ] No secrets/keys committed
- [ ] .gitignore updated (nếu cần)
- [ ] PR description complete

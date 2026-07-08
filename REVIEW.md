# REVIEW.md

# Code Review Guide

This document defines the review process for every code change.

The objective is to ensure every modification improves the project without introducing regressions.

---

# Review Philosophy

Every code review should prioritize:

1. Correctness
2. Data Integrity
3. Security
4. Maintainability
5. Performance
6. Readability

Never approve code simply because it works.

---

# Review Workflow

Every change should follow this workflow:

Requirement

↓

Analysis

↓

Architecture Review

↓

Implementation

↓

Verification

↓

Code Review

↓

Merge

Never skip analysis or verification.

---

# Requirement Review

Before reviewing code, verify:

- The requirement is clearly understood.
- No assumptions were made.
- Business rules are respected.
- Scope matches the original request.

Questions:

- Does this solve the requested problem?
- Does it introduce unrelated changes?
- Are edge cases considered?

---

# Architecture Review

Confirm:

- Existing architecture is preserved.
- Layer responsibilities remain clear.
- No circular dependencies.
- No unnecessary abstractions.
- No duplicate implementations.

Reject if:

- Business logic is placed inside UI.
- Database logic is inside components.
- APIs are bypassed.

---

# File Review

Verify:

- Only necessary files changed.
- No accidental formatting-only commits.
- No unrelated modifications.
- No generated files committed.
- No secrets committed.

Reject if unrelated files are modified.

---

# React Review

Verify:

- Functional components only.
- Hooks are used correctly.
- State is minimal.
- Components remain reusable.
- No duplicated state.
- No unnecessary re-render.

Reject if:

- Components become too large.
- Business logic is duplicated.
- Props become deeply nested.

---

# Backend Review

Verify:

- REST API conventions followed.
- Validation exists.
- Error handling exists.
- Existing endpoints preserved.
- Response format unchanged.

Reject if:

- API contracts break.
- Validation is missing.
- Errors are silently ignored.

---

# Database Review

Verify:

- Data integrity preserved.
- No unintended schema changes.
- Input validation exists.
- Existing records remain safe.

Reject if:

- Data corruption is possible.
- Records are silently deleted.
- IDs are hardcoded.

---

# UI Review

Verify:

- UI appearance remains unchanged unless requested.
- Responsive layout preserved.
- Accessibility maintained.
- Existing navigation preserved.

Reject if:

- Colors change unexpectedly.
- Layout changes without approval.
- Components move unnecessarily.

---

# Security Review

Verify:

- Input validation exists.
- File uploads validated.
- API parameters validated.
- Sensitive information protected.

Reject if:

- API keys exposed.
- Passwords committed.
- Internal paths exposed.
- User input trusted blindly.

---

# Performance Review

Verify:

- No duplicate API calls.
- No unnecessary rendering.
- Efficient loops.
- Reusable components.
- Memoization where appropriate.

Reject if:

- Performance noticeably degrades.
- Expensive operations run repeatedly.

---

# Business Logic Review

Verify:

- Engineering calculations remain correct.
- KPI formulas unchanged.
- Cost calculations correct.
- Progress calculations correct.
- Risk calculations correct.

Reject if:

- Business rules change without approval.
- Hardcoded values introduced.

---

# Error Handling Review

Verify:

- Exceptions handled.
- User-friendly error messages.
- Useful debug logs.
- No silent failures.

Reject if:

- Errors disappear silently.
- Empty catch blocks exist.

---

# Documentation Review

Verify:

Documentation updated when necessary.

Check:

- AGENTS.md
- PROJECT_CONTEXT.md
- ARCHITECTURE.md
- ROADMAP.md
- CHANGELOG.md

Reject if major features are undocumented.

---

# Git Review

Verify:

Small commits.

Meaningful messages.

Accepted prefixes:

- feat:
- fix:
- refactor:
- docs:
- style:
- test:
- perf:
- chore:

Reject huge mixed commits.

---

# Testing Review

Before approval verify:

Application builds successfully.

No runtime errors.

No console errors.

No broken imports.

No broken routes.

Existing features continue working.

New feature behaves correctly.

---

# AI Review Rules

When AI submits code:

Always verify:

- Requirement understanding.
- Architecture impact.
- Related files.
- Side effects.
- Business logic.
- Regression risk.

Never trust generated code without review.

---

# Common Review Questions

Before approving ask:

Does this solve the requested problem?

Could this be simpler?

Is existing code reusable?

Are there hidden side effects?

Will this scale?

Will another developer understand this in six months?

Does this preserve project architecture?

---

# Review Checklist

General

☐ Requirement understood

☐ Scope correct

☐ Architecture preserved

☐ No unrelated changes

Code

☐ Readable

☐ Modular

☐ No duplication

☐ No hardcoded values

☐ Naming consistent

React

☐ Hooks correct

☐ State minimal

☐ Components reusable

Backend

☐ Validation exists

☐ Error handling exists

☐ API unchanged

Database

☐ Safe

☐ No corruption risk

☐ No schema issues

Security

☐ Inputs validated

☐ Secrets protected

Performance

☐ No regressions

Business

☐ KPI correct

☐ Cost correct

☐ Progress correct

☐ Risk correct

Documentation

☐ Updated

Testing

☐ Build passes

☐ Runtime passes

☐ Existing features verified

Git

☐ Commit message correct

☐ Small commit

---

# Approval Criteria

Approve only when:

- The implementation satisfies the requirement.
- Architecture remains consistent.
- Business rules are preserved.
- No regressions are introduced.
- Documentation is updated.
- Testing passes.

Otherwise request changes.

---

# Final Rule

The goal of code review is not to find mistakes.

The goal is to continuously improve the quality, reliability, and maintainability of the Project Management ERP system.
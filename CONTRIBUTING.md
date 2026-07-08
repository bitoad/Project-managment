# CONTRIBUTING.md

# Contributing Guide

Thank you for contributing.

This document defines the workflow for all contributors and AI coding assistants.

---

# Branch Strategy

main

Production-ready code.

develop

Integration branch.

feature/*

New features.

fix/*

Bug fixes.

hotfix/*

Production fixes.

---

# Workflow

Requirement

↓

Analysis

↓

Architecture Review

↓

Implementation

↓

Testing

↓

Code Review

↓

Merge

---

# Before Coding

Always

Read

- AGENTS.md
- PROJECT_CONTEXT.md
- ARCHITECTURE.md

Understand

- Business rules
- Existing architecture
- Related files

Never edit blindly.

---

# Coding Standards

Keep

- Modular
- Readable
- Reusable
- Consistent

Avoid

- Hardcoded values
- Duplicate logic
- Breaking changes

---

# Commit Message Format

Examples

feat: add procurement dashboard

fix: correct kanban port assignment

docs: update architecture

refactor: simplify dashboard calculation

test: add api tests

---

# Pull Request Checklist

☐ Build passes

☐ No runtime errors

☐ Documentation updated

☐ Existing functionality preserved

☐ No hardcoded values

☐ No duplicate code

☐ Architecture respected

---

# Review Process

Every PR must

Explain

- Why

- What

- Impact

- Testing

---

# AI Contributors

AI-generated code must

- Respect AGENTS.md
- Preserve architecture
- Avoid speculation
- Explain assumptions
- Keep changes minimal

Human review is always required.

---

# Final Goal

Every contribution should improve the long-term quality of the Project Management ERP system.
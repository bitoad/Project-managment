# ARCHITECTURE.md

# System Architecture

## Overview

Project Management System is a full-stack web application designed for Engineering, Procurement, and Construction (EPC) projects.

Architecture style:

Client (React)

↓

REST API (Express)

↓

Business Logic

↓

SQL.js Database

↓

JSON Persistence

The architecture follows a modular design to maximize maintainability, scalability, and code reuse.

---

# High-Level Architecture

```

┌───────────────────────────┐
│ Browser │
└──────────────┬────────────┘
│
React + Ant Design
│
Axios
│
┌──────────────▼────────────┐
│ Express API │
└──────────────┬────────────┘
│
Business Logic
│
SQL.js
│
JSON Storage

```

---

# Frontend Architecture

Framework

- React
- Vite

UI

- Ant Design

Charts

- Recharts

HTTP

- Axios

Routing

- React Router

State Management

Current

- React Context

Future

- TanStack Query (optional)
- Zustand (optional)

---

# Frontend Folder Structure

```

src/

api/
All HTTP communication.

components/
Reusable UI components.

context/
Global application state.

layout/
Application layout.

pages/
Feature pages.

assets/
Images and icons.

styles/
Future shared styling.

```

---

# Page Responsibilities

Dashboard

Responsible for

- KPI visualization
- Charts
- Progress
- Cost overview

---

Projects

Responsible for

- Project list
- Project creation
- Project metadata

---

Ports

Responsible for

- Work packages
- Port information

---

Kanban

Responsible for

- Task management
- Workflow status

---

Timeline

Responsible for

- Schedule visualization

---

Items

Responsible for

- Material items

---

Cost Log

Responsible for

- Cost tracking
- Budget tracking

---

Documents

Responsible for

- Upload
- Download
- Search

---

Reports

Responsible for

- Report generation

---

Risk Matrix

Responsible for

- Risk tracking

---

Suppliers

Responsible for

- Supplier database

---

Quotations

Responsible for

- RFQ
- Quotations

---

Team

Responsible for

- Team members

---

# Component Architecture

Components should be

Reusable

Composable

Independent

Avoid page-specific business logic inside reusable components.

---

# State Management

Current

React Context

Responsibilities

- User
- Project
- Theme (future)
- Settings (future)

Local state

useState

Complex state

useReducer (when appropriate)

Never duplicate global state.

---

# Backend Architecture

Entry point

server.js

Responsibilities

- REST API
- Validation
- Database access
- File uploads

Backend should remain stateless.

---

# API Layer

Pattern

Browser

↓

Axios

↓

Express Route

↓

Business Logic

↓

Database

↓

Response

All APIs should

- Validate input
- Return consistent JSON
- Use proper HTTP status codes

---

# Database Layer

Current

SQL.js

Persistence

JSON files

Future

SQLite

↓

PostgreSQL

Database layer should remain isolated from UI.

Business logic should never exist inside React components.

---

# Data Flow

Typical request

User Action

↓

React Component

↓

API Function

↓

Express Endpoint

↓

Business Logic

↓

Database

↓

JSON Response

↓

React State

↓

UI Update

---

# Authentication

Current

Simple login

Future

JWT

RBAC

OAuth

Permissions

Admin

↓

Project Manager

↓

Engineer

↓

Supervisor

↓

Viewer

Authorization must always be checked on the server.

---

# File Upload Architecture

Current

multer

Storage

Local filesystem

Future

Cloud Storage

Azure Blob

AWS S3

Google Cloud Storage

---

# Error Handling

Every layer should handle errors.

Frontend

Display user-friendly message.

Backend

Return structured error response.

Database

Never expose internal errors.

---

# Logging

Current

Console logging

Future

Structured logging

Audit Log

Error tracking

Never expose stack traces to users.

---

# Security

Always

Validate input.

Validate uploads.

Sanitize request.

Validate IDs.

Never trust frontend input.

---

# Performance

Frontend

- Lazy loading
- Memoization
- Component reuse

Backend

- Avoid duplicate queries
- Cache when appropriate

Database

- Avoid repeated reads

---

# Coding Layers

Presentation Layer

↓

Application Layer

↓

Business Layer

↓

Persistence Layer

Each layer should have a single responsibility.

Never mix UI with business logic.

---

# Dependency Rules

Allowed

Pages

↓

Components

↓

API

↓

Server

↓

Database

Avoid

Pages calling database directly.

Components containing business rules.

Circular dependencies.

---

# Naming Conventions

Components

PascalCase

Pages

PascalCase

Hooks

useSomething

Utilities

camelCase

Constants

UPPER_CASE

Files should use descriptive names.

---

# Future Architecture

Future integrations

- Power BI
- SAP
- BIM
- OCR
- AI Assistant
- Microsoft Project
- Primavera
- Google Calendar
- Outlook

Architecture should remain modular enough to support these integrations.

---

# Architectural Principles

Always

Read before modifying.

Reuse existing modules.

Keep functions small.

Keep responsibilities isolated.

Prefer composition over duplication.

Avoid unnecessary abstractions.

---

# Non-Goals

Do not

Rewrite architecture.

Replace libraries without approval.

Move files unnecessarily.

Create duplicate implementations.

Introduce breaking API changes.

---

# Architecture Review Checklist

Before merging changes

✓ Architecture preserved

✓ Layer separation maintained

✓ No duplicated business logic

✓ API consistency maintained

✓ Database integrity preserved

✓ No unnecessary dependencies

✓ No circular imports

✓ Components remain reusable

✓ Existing functionality preserved

✓ Project remains scalable

---

# Long-Term Architecture Vision

The system should evolve into a modular ERP platform capable of managing multiple EPC projects simultaneously.

Future architecture should support

- Multi-project
- Multi-company
- Multi-user
- RBAC
- Workflow Engine
- Procurement System
- Cost Control
- Resource Planning
- Document Control
- AI Assistant
- Business Intelligence

without requiring a major rewrite.
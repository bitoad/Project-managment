# PROJECT_CONTEXT.md

# Project Context

## Project Name

Project Management System

---

# Purpose

This project is a production-quality Project Management / ERP system designed for Engineering, Procurement, Construction (EPC) projects.

The long-term objective is to replace spreadsheet-based project management with an integrated web application that centralizes engineering, procurement, construction, documentation, scheduling, cost control, and reporting.

The system should be scalable, maintainable, and suitable for real industrial projects.

---

# Business Domain

Industry:

- Engineering
- Procurement
- Construction (EPC)
- Oil & Gas
- Industrial Projects
- Modular Construction

Typical project lifecycle:

Tender
↓

Engineering

↓

Procurement

↓

Manufacturing

↓

Installation

↓

Commissioning

↓

Project Close-out

---

# Target Users

Current users

- Project Manager
- Engineering Manager
- Procurement Engineer
- Cost Controller
- Site Supervisor
- Management

Future users

- Client
- Vendor
- Contractor
- Inspector
- QA/QC
- Document Controller

---

# Business Goals

The system should provide a single source of truth for all project information.

Goals include

- Project visibility
- Cost control
- Progress tracking
- Procurement tracking
- Document management
- Resource planning
- Risk management
- Reporting
- Historical records

---

# Current Technology Stack

Frontend

- React
- Vite
- Ant Design
- Axios
- Recharts

Backend

- Node.js
- Express.js

Database

Current

SQL.js

Future

SQLite

PostgreSQL

Authentication

Current

Simple Login

Future

JWT

RBAC

OAuth

---

# Current Architecture

Frontend

React SPA

↓

Axios

↓

Express API

↓

SQL.js Database

↓

JSON Persistence

The architecture should remain modular.

Avoid introducing unnecessary complexity.

---

# Folder Structure

src/

Contains all frontend source code.

Subfolders

api/

HTTP API layer.

components/

Reusable UI components.

context/

React Context providers.

layout/

Application layout.

pages/

Application pages.

database/

Database initialization and persistence.

public/

Static assets.

server.js

Backend entry point.

---

# Existing Modules

Dashboard

Purpose

Project overview.

Displays

- KPIs
- Charts
- Risk summary
- Progress summary
- Cost summary

---

Projects

Manage engineering projects.

Each project contains

- Ports
- Tasks
- Documents
- Costs

---

Ports

Represents project sections or work packages.

Every Port may contain

- Tasks
- Costs
- Documents
- Timeline

---

Items

Project material items.

Future

Material master database.

---

Kanban

Task management.

Status

- Todo
- In Progress
- Review
- Done

Future

Dependencies

Assignment

Notifications

---

Timeline

Schedule visualization.

Future

Critical Path

Milestones

Dependencies

---

Cost Log

Tracks

Budget

Actual Cost

Remaining Budget

Future

Forecast

Cost Variance

Earned Value

---

Suppliers

Supplier database.

Future

Vendor qualification.

Performance history.

---

Quotations

RFQ tracking.

Future

Comparison

Approval

Purchase Order

---

Documents

Document management.

Upload

Download

Search

Version control (future)

---

Risk Matrix

Project risks.

Future

Probability

Impact

Mitigation

Ownership

---

Reports

Generate reports.

Future

PDF

Excel

Power BI

---

Team

Manage project members.

Future

Roles

Permissions

Resource loading

---

Data Entry

Manual project data entry.

Future

Bulk import

Excel import

API integration

---

# Future Modules

Procurement

Vendor Management

Material Tracking

BOQ

Approval Workflow

Audit Log

Notification Center

Calendar

Resource Planning

AI Assistant

OCR

Power BI

BIM Integration

SAP Integration

---

# Core Business Entities

Projects

↓

Ports

↓

Tasks

↓

Documents

↓

Costs

↓

Reports

Other entities

Suppliers

Materials

Items

Risks

Quotations

Users

Timeline

Resources

---

# Dashboard KPIs

Current KPIs

Budget

Actual Cost

Progress

Risk

Future KPIs

SPI

CPI

Planned Value

Earned Value

Actual Cost

Schedule Variance

Cost Variance

Forecast Cost

Forecast Finish

Never modify KPI formulas without approval.

---

# Coding Philosophy

Maintainability first.

Prefer

Small reusable components.

Clear naming.

Simple architecture.

Incremental improvements.

Never sacrifice maintainability for short-term speed.

---

# UI Philosophy

Current UI library

Ant Design

Design goals

Professional

Minimal

Fast

Consistent

Responsive

Accessible

Never redesign UI unless requested.

---

# API Philosophy

REST API.

Consistent JSON responses.

Validation on every endpoint.

Never break existing API contracts.

---

# Database Philosophy

Current

SQL.js

Future

SQLite

PostgreSQL

Protect data integrity.

Never silently delete records.

Never corrupt existing data.

---

# Development Principles

Always

Understand requirements.

Read related files.

Analyze architecture.

Reuse existing code.

Keep modules independent.

Document major decisions.

Verify changes.

Never

Guess business logic.

Invent requirements.

Rewrite unrelated code.

Introduce breaking changes.

Move files without approval.

Hardcode values.

---

# AI Expectations

Every AI assistant working on this project should

Understand the business before coding.

Read existing implementation.

Respect current architecture.

Preserve backward compatibility.

Suggest improvements before implementation.

Never implement speculative features.

Always explain important architectural decisions.

---

# Long-Term Vision

The final system should evolve into a complete ERP platform for EPC projects.

Target capabilities include

Engineering

Procurement

Construction

Cost Control

Planning

Scheduling

Risk Management

Document Control

Vendor Management

Inventory

Resource Planning

Reporting

Business Intelligence

AI Assistance

The software should be suitable for deployment in real engineering organizations with multiple concurrent projects.

---

# Success Criteria

A successful implementation should

Scale to many projects.

Support multiple users.

Remain maintainable.

Have clear architecture.

Minimize technical debt.

Provide accurate project information.

Improve project execution efficiency.

Remain easy to extend for future business requirements.
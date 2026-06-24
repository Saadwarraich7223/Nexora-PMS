```markdown
# CLAUDE.md - Final Year Project Management System (FYPMS)

**Project Name:** Final Year Project Management System (FYPMS)
**Tech Stack:** MERN (MongoDB, Express.js, React 19, Node.js)
**Architecture:** Monorepo (backend + frontend)
**Version:** 1.0.0
**Last Updated:** June 2, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Backend Structure](#backend-structure)
4. [Frontend Structure](#frontend-structure)
5. [Data Models](#data-models)
6. [API Routes](#api-routes)
7. [Authentication & Authorization](#authentication--authorization)
8. [Real-Time Features](#real-time-features)
9. [File Upload System](#file-upload-system)
10. [GitHub Integration](#github-integration)
11. [Email System](#email-system)
12. [Grading & Evaluation](#grading--evaluation)
13. [Deployment & DevOps](#deployment--devops)
14. [Development Workflow](#development-workflow)
15. [Known Issues & Technical Debt](#known-issues--technical-debt)
16. [Future Roadmap](#future-roadmap)

---

## Project Overview

### Purpose

FYPMS is a comprehensive web platform designed to manage **Final Year Projects (FYP)**
for universities. It facilitates:

- Student group formation
- Project proposal submission and review
- Task and deadline management
- Supervisor assignment
- GitHub integration for code tracking
- Automated evaluation and grading
- Real-time notifications

### User Roles

1. **Admin** - System administrator (manages teachers, students, groups, announcements)
2. **Teacher** - Project supervisor (reviews proposals, creates deadlines, evaluates
   projects)
3. **Student** - Project team member (forms groups, submits proposals, manages tasks)

### Core Workflows

STUDENT WORKFLOW:

1. Register → Admin approves → Login
2. Create/Join Group → Invite members
3. Request Supervisor → Admin approves
4. Link GitHub Repository
5. Submit Project Proposal → Teacher reviews
6. Manage Tasks (Kanban) → Complete Deadlines
7. Record Meeting Logs
8. View Final Evaluation

TEACHER WORKFLOW:

1. Login → View assigned groups
2. Review Project Proposals → Approve/Reject with feedback
3. Create Deadlines for supervised groups
4. Track group progress (tasks, commits, meetings)
5. Calculate and publish final grades

ADMIN WORKFLOW:

1. Login → View system dashboard
2. Add teachers (set supervisor capacity)
3. Approve/reject student registrations
4. Assign supervisors to groups
5. View analytics and at-risk groups
6. Broadcast announcements

---

## System Architecture

### High-Level Architecture

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND │
│ (React 19 + Redux Toolkit + TailwindCSS + Vite) │
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Admin │ │ Teacher │ │ Student │ │ Auth │ │
│ │ Portal │ │ Portal │ │ Portal │ │ Pages │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└───────────────────────┬─────────────────────────────────────┘
```

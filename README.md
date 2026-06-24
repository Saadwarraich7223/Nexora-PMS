# Final Year Project Management System (FYPMS)

A comprehensive MERN-stack platform for managing university Final Year Projects (FYP) end-to-end. Facilitates student group formation, supervisor assignment, proposal review, task tracking, real-time collaboration, and automated evaluation.

> **Version:** 1.0.0 | **Architecture:** Monorepo (backend + frontend) | **Status:** Production-ready

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [User Roles & Workflows](#user-roles--workflows)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [AI Features](#ai-features)
- [GitHub Integration](#github-integration)
- [Real-Time Features](#real-time-features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features

| Feature | Description |
|---|---|
| **Authentication & Authorization** | Multi-role JWT-based auth (Admin, Teacher, Student) with httpOnly cookies and role-based middleware |
| **Group Management** | Create groups, invite/join requests, leader transfer, supervisor assignment workflow |
| **Project Proposals** | Submit proposals with file attachments, teacher review workflow with structured feedback |
| **Task Management** | Kanban board (To Do / In Progress / Done), task assignment, priority levels, due dates |
| **Meeting Logs** | Record meetings with agendas, attendees, and linked tasks/features |
| **Deadline System** | Teacher-created deadlines with completion tracking and linked grading |
| **Evaluation & Grading** | Configurable weighted grading with group-level and individual scores, peer review support |
| **Notifications** | Real-time in-app notifications (Socket.IO) + email for critical events |
| **File Management** | Unified file system supporting proposal attachments, group resources, avatars |
| **GitHub Integration** | Link repos, auto-sync commits via cron, track PRs and issues, webhook support |
| **Calendar** | Unified calendar view (React Big Calendar) for deadlines, meetings, and tasks |

### AI-Powered Features

- **AI Task Generator** — Breaks down feature descriptions into actionable, structured tasks with priority levels
- **AI Meeting Summarizer** — Processes raw meeting notes into professional summaries with extracted action items
- **Smart Feedback** — AI-assisted feedback composition for supervisors
- **Proposal Quality Checklist** — Automated completeness checks for project proposals

### Admin Features

- System analytics dashboard with at-risk group detection
- User management (students, faculty) with CRUD operations
- Faculty workload/capacity tracking and supervisor assignment
- Group moderation (approve/reject formations, supervisor requests)
- Batch student onboarding via CSV upload
- Broadcast announcements with role/department targeting
- System-wide evaluation oversight

### Teacher Features

- Group supervision workspace with unified "Group Health" view
- Project proposal review (approve/reject with structured feedback)
- Meeting creation and management
- Configurable evaluation and grading with custom templates
- Resource access for supervised groups
- GitHub insights (commits, PRs, issues)
- Deadline creation with grade linking

### Student Features

- Group lifecycle (create, invite, join, request supervisor)
- Kanban task board with drag-and-drop
- Project proposal submission with file uploads
- Meeting logging with task/feature linking
- Deadline tracking with completion status
- Feature workspace with task traceability
- Resource management (upload, link to tasks)
- Real-time notification center with priority filtering
- Evaluation and grade viewing

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | HTTP framework & REST API |
| **MongoDB** | Primary database |
| **Mongoose** | ODM / schema management |
| **Socket.IO** | Real-time bidirectional communication |
| **JWT** | Authentication (access + refresh tokens) |
| **Nodemailer** | Email notifications |
| **Winston** | Structured logging |
| **Multer** | File upload handling |
| **Joi** | Request validation |
| **Helmet** | Security headers |
| **Express Rate Limit** | API rate limiting |
| **node-cron** | Scheduled background jobs |
| **Groq SDK** | AI inference (Llama 3.1) |
| **Jest + Supertest** | Testing framework |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite** | Build tool / dev server |
| **Redux Toolkit** | State management |
| **React Router v7** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Socket.IO Client** | Real-time updates |
| **@hello-pangea/dnd** | Drag-and-drop (Kanban) |
| **Recharts** | Charts & analytics |
| **React Big Calendar** | Calendar views |
| **React Hot Toast** | Toast notifications |
| **React Icons** | Icon library |
| **Axios** | HTTP client |
| **date-fns** | Date utilities |
| **Prism.js** | Syntax highlighting |
| **html2pdf.js** | PDF export |
| **@uiw/react-md-editor** | Markdown editing |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │   Auth   │ │  Admin   │ │ Teacher  │ │    Student     │  │
│  │  Pages   │ │  Portal  │ │  Portal  │ │    Portal      │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                      │  Redux Toolkit + Socket.IO Client     │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────┴───────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Routes  │ │Middleware│ │ Service  │ │    Socket.IO   │  │
│  │          │ │ (Auth,   │ │  Layer   │ │    Server      │  │
│  │          │ │  Role,   │ │          │ │                │  │
│  │          │ │  Upload) │ │          │ │                │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                      │                                        │
│       ┌──────────────┴──────────────┐                        │
│       │        AI Engine            │                        │
│       │    (Groq / Llama 3.1)      │                        │
│       └─────────────────────────────┘                        │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────────┐
│                     STORAGE LAYER                              │
│  ┌─────────────────────┐  ┌────────────────────────────────┐  │
│  │      MongoDB        │  │     Local File Storage         │  │
│  │   (Mongoose ODM)    │  │  (Uploads / Temp / Projects)  │  │
│  └─────────────────────┘  └────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
FYPMS/
├── backend/                          # Express.js API server
│   ├── src/
│   │   ├── app.js                    # Express app setup & middleware
│   │   ├── index.js                  # Server entry point
│   │   ├── config/                   # DB, env, mailer, grading config
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   ├── env.js                # Environment config loader
│   │   │   ├── gradingConfig.js      # Grading weight defaults
│   │   │   └── mailer.js             # Nodemailer transport
│   │   ├── controllers/              # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── chat.controller.js
│   │   │   └── search.controller.js
│   │   ├── middleware/               # Express middleware
│   │   │   ├── authMiddleware.js     # JWT verification
│   │   │   ├── roleMiddleware.js     # Role-based access
│   │   │   ├── validateMiddleware.js # Joi validation
│   │   │   ├── uploadMiddleware.js   # File upload (Multer)
│   │   │   ├── rateLimitMiddleware.js
│   │   │   ├── errorHandlerMiddleware.js
│   │   │   └── notFoundMiddleware.js
│   │   ├── models/                   # Mongoose schemas (20 models)
│   │   │   ├── user.model.js
│   │   │   ├── group.model.js
│   │   │   ├── project.model.js
│   │   │   ├── task.model.js
│   │   │   ├── meetingLog.model.js
│   │   │   ├── deadline.model.js
│   │   │   ├── evaluation.model.js
│   │   │   ├── notification.model.js
│   │   │   ├── file.model.js
│   │   │   ├── request.model.js
│   │   │   ├── feature.model.js
│   │   │   ├── milestone.model.js
│   │   │   ├── gradingTemplate.model.js
│   │   │   ├── rubricCriteria.model.js
│   │   │   ├── gradeChallenge.model.js
│   │   │   ├── completionPolicy.model.js
│   │   │   ├── completionAudit.model.js
│   │   │   ├── signal.model.js
│   │   │   ├── chatHistory.model.js
│   │   │   ├── PreApprovedStudent.model.js
│   │   │   └── ...
│   │   ├── routes/                   # API route definitions
│   │   │   ├── auth.route.js
│   │   │   ├── admin.route.js
│   │   │   ├── teacher.route.js
│   │   │   ├── student.route.js
│   │   │   ├── user.route.js
│   │   │   ├── notification.route.js
│   │   │   ├── chat.route.js
│   │   │   ├── search.route.js
│   │   │   └── webhook.route.js
│   │   ├── services/                 # Business logic layer
│   │   │   ├── auth.service.js
│   │   │   ├── user.service.js
│   │   │   ├── email.service.js
│   │   │   ├── notification.service.js
│   │   │   ├── ai.service.js
│   │   │   ├── chat.service.js
│   │   │   ├── intelligence.service.js
│   │   │   ├── rag.service.js
│   │   │   ├── evidence.service.js
│   │   │   ├── escalation.service.js
│   │   │   └── integrity.service.js
│   │   ├── sockets/
│   │   │   └── index.js              # Socket.IO setup & namespaces
│   │   ├── utils/                    # Utilities
│   │   │   ├── tokens.js             # JWT sign/verify
│   │   │   ├── apiError.js           # Custom error class
│   │   │   ├── asyncHandler.js       # Async wrapper
│   │   │   ├── logger.js             # Winston logger
│   │   │   ├── pagination.js         # Pagination helper
│   │   │   ├── cronJobs.js           # Scheduled tasks
│   │   │   ├── availability.js
│   │   │   └── createAdmin.js
│   │   ├── validations/
│   │   │   └── auth.validations.js
│   │   └── uploads/                  # File upload storage
│   │       ├── temp/
│   │       ├── projects/
│   │       └── ...
│   ├── tests/                        # Test suites
│   │   ├── unit/                     # Unit tests (models, middleware, services)
│   │   ├── integration/              # Integration tests (routes + DB)
│   │   ├── e2e/                      # End-to-end API tests
│   │   └── helpers/                  # Test utilities (DB, auth, factories)
│   ├── migrations/                   # Data migration scripts
│   ├── postmanTesting/               # Postman collections
│   └── package.json
│
├── frontend/                         # React SPA
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── main.jsx                  # React entry point
│   │   ├── App.jsx                   # Root component
│   │   ├── app/                      # App-level config
│   │   │   ├── providers/            # Context providers
│   │   │   └── routes/              # Protected/role-based routing
│   │   │       ├── AppRouter.jsx
│   │   │       ├── ProtectedRoute.jsx
│   │   │       ├── RoleRoute.jsx
│   │   │       ├── admin/AdminRoutes.jsx
│   │   │       ├── teacher/TeacherRoutes.jsx
│   │   │       └── student/StudentRoutes.jsx
│   │   ├── features/                 # Feature-based modules
│   │   │   ├── auth/                 # Login, Register, authSlice
│   │   │   ├── admin/                # Admin dashboard, management pages
│   │   │   ├── teacher/              # Teacher dashboard, evaluation, groups
│   │   │   ├── student/              # Student dashboard, tasks, meetings
│   │   │   ├── projects/            # Shared project components
│   │   │   └── calendar/            # Calendar page
│   │   ├── components/               # Shared UI components
│   │   ├── store/                    # Redux store configuration
│   │   ├── services/                 # API service layer (Axios)
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── context/                  # React context providers
│   │   ├── utils/                    # Frontend utilities
│   │   ├── assets/                   # Images, fonts
│   │   ├── data/                     # Static data
│   │   └── styles/                   # Global styles
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── .github/workflows/               # CI/CD pipelines
├── .gitignore
├── CLAUDE.md                         # AI assistant configuration
└── README.md                         # This file
```

---

## User Roles & Workflows

### Student Workflow

```
Register → Admin approves → Login
    ↓
Create/Join Group → Invite members
    ↓
Request Supervisor → Admin approves
    ↓
Link GitHub Repository
    ↓
Submit Project Proposal → Teacher reviews → Revise if rejected
    ↓
Manage Tasks (Kanban) → Complete Deadlines
    ↓
Record Meeting Logs
    ↓
View Final Evaluation
```

### Teacher Workflow

```
Login → View assigned groups
    ↓
Review Project Proposals → Approve/Reject with feedback
    ↓
Create Deadlines for supervised groups
    ↓
Track group progress (tasks, commits, meetings)
    ↓
Calculate and publish final grades
```

### Admin Workflow

```
Login → View system dashboard
    ↓
Add teachers (set supervisor capacity)
    ↓
Approve/reject student registrations
    ↓
Assign supervisors to groups
    ↓
View analytics and at-risk groups
    ↓
Broadcast announcements
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (local or Atlas)
- **npm** >= 9.x
- **Git**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd FYPMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Setup

```bash
# Backend environment configuration
cd backend
cp .env.example .env
# Edit .env with your configuration (see Configuration section)
```

### Development

```bash
# Start backend (from backend/)
npm run dev          # Development with nodemon

# Start frontend (from frontend/)
npm run dev          # Vite dev server on port 5173

# Start both simultaneously (from root - requires concurrent)
# Or use two terminal windows
```

The backend API runs on `http://localhost:5000` and the frontend on `http://localhost:5173` by default.

### Production Build

```bash
# Build frontend
cd frontend
npm run build        # Outputs to frontend/dist/

# Start backend in production
cd backend
NODE_ENV=production npm start
```

---

## Configuration

### Backend Environment Variables (.env)

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | API server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/pms` |
| `JWT_ACCESS_SECRET` | JWT access token secret | (required) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | (required) |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `COOKIE_SECURE` | Use secure cookies | `false` |
| `COOKIE_SAME_SITE` | SameSite policy | `lax` |
| `CLIENT_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |
| `ADMIN_EMAIL` | Default admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Default admin password | `ChangeMe123!` |
| `SMTP_HOST` | SMTP server host | (optional) |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | (optional) |
| `SMTP_PASS` | SMTP password | (optional) |
| `MAIL_FROM` | From address | `FYPMS <no-reply@example.com>` |
| `UNIVERSITY_NAME` | University name for emails | `University` |
| `UPLOAD_DIR` | File upload directory | `uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5MB) |
| `SUPERVISOR_DEFAULT_CAPACITY` | Default supervisor capacity | `6` |
| `CONTRIBUTION_TASK_WEIGHT` | Task weight in contribution | `0.35` |
| `CONTRIBUTION_FEATURE_WEIGHT` | Feature weight in contribution | `0.25` |
| `CONTRIBUTION_REPORT_WEIGHT` | Report weight in contribution | `0.20` |
| `CONTRIBUTION_PEER_WEIGHT` | Peer review weight | `0.20` |

---

## Available Scripts

### Backend

| Script | Command | Description |
|---|---|---|
| `dev` | `nodemon src/index.js` | Start dev server with auto-reload |
| `start` | `node src/index.js` | Start production server |
| `test` | `jest` | Run all tests |
| `test:unit` | `jest tests/unit` | Run unit tests only |
| `test:integration` | `jest tests/integration` | Run integration tests |
| `test:e2e` | `jest tests/e2e` | Run end-to-end tests |
| `coverage` | `jest --coverage` | Run tests with coverage report |

### Frontend

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start Vite dev server |
| `build` | `vite build` | Production build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Lint all source files |

---

## API Overview

The backend exposes a RESTful API organized by role. All routes are prefixed with `/api`.

### Auth Routes (`/api/auth`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register new student |
| POST | `/login` | Login (returns httpOnly cookie) |
| POST | `/logout` | Logout (clears cookie) |
| POST | `/refresh-token` | Refresh access token |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | System analytics |
| GET/POST | `/students` | List/create students |
| PATCH | `/students/:id` | Update student |
| GET/POST | `/faculty` | List/create teachers |
| PATCH | `/faculty/:id` | Update faculty |
| GET/POST | `/groups` | List/modify groups |
| POST | `/groups/:id/assign-supervisor` | Assign supervisor |
| GET/POST | `/announcements` | Broadcast messages |

### Teacher Routes (`/api/teacher`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/groups` | Supervised groups |
| GET | `/groups/:id/workspace` | Group health workspace |
| POST | `/proposals/:id/review` | Approve/reject proposal |
| POST | `/feedback` | Create feedback |
| POST | `/deadlines` | Create deadline |
| GET | `/evaluations` | View evaluations |
| POST | `/evaluations` | Create/publish evaluation |
| GET | `/resources/:fileId/download` | Download group resource |

### Student Routes (`/api/student`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Student dashboard |
| POST | `/groups` | Create group |
| POST | `/groups/invite` | Invite member |
| POST | `/groups/join` | Request to join |
| POST | `/proposals` | Submit proposal |
| GET | `/proposals/:id` | View proposal |
| GET/POST | `/tasks` | List/create tasks |
| PATCH | `/tasks/:id` | Update task status |
| POST | `/meetings` | Log meeting |
| POST | `/resources/upload` | Upload file |
| GET | `/evaluations` | View evaluations |

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List user notifications |
| PATCH | `/:id/read` | Mark as read |
| POST | `/read-all` | Mark all as read |

### GitHub Webhook (`/api/webhook/github`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/github` | GitHub webhook receiver |

---

## AI Features

FYPMS integrates with **Groq SDK** (Llama 3.1 8b) for several AI-powered features:

### Implemented

- **AI Task Generator** — Automatically decomposes feature descriptions into structured tasks (frontend/backend/database) with priority levels
- **AI Meeting Summarizer** — Converts raw meeting notes into professional summaries with extracted action items
- **AI-Assisted Feedback** — Helps supervisors compose structured feedback

### Roadmap

- **AI Contribution Pulse** — Analyzes traceability data to generate individual impact scores
- **Autonomous Project Auditor** — Weekly automated audits comparing proposal timelines against Kanban progress
- **Feedback Copilot** — Smart reply suggestions and professional feedback expansion
- **Sentiment-Based Intervention** — Monitors meeting logs for conflict signals
- **One-Click Grading Justifier** — Auto-generates formal grading justifications
- **Plagiarism Guard** — Scans uploaded resources for LLM-generated content
- **Autonomous Meeting Scheduler** — Coordinates calendars for at-risk project remediation

---

## GitHub Integration

FYPMS provides deep GitHub integration for tracking student project progress:

### Features

- **Repository Linking** — Students link their GitHub repository to their group
- **Commit Tracking** — Auto-syncs commits via hourly cron job (`node-cron`)
- **Pull Request & Issue Tracking** — Tracks PRs (merged/open) and issues (open/closed) via GitHub REST API
- **Webhook Support** — Real-time updates via GitHub webhooks with HMAC-SHA256 signature verification
- **Contribution Analysis** — Author aggregation and activity tracking per group member

### Setup

1. Create a GitHub OAuth App or Personal Access Token
2. Add the token to your backend `.env`
3. Configure webhook URL: `https://your-domain.com/api/webhook/github`
4. Students link their repositories via the student dashboard

---

## Real-Time Features

FYPMS uses **Socket.IO** for real-time communication:

- **Live Notifications** — Instant in-app alerts for task updates, feedback, deadlines, and announcements
- **Connection States** — Read/unread tracking with badge counts
- **Namespace** — Dedicated `/notifications` namespace
- **Event-driven** — Server pushes events on data mutations

---

## Testing

### Backend Test Stack

| Tool | Purpose |
|---|---|
| **Jest** | Test runner |
| **Supertest** | HTTP API integration testing |
| **mongodb-memory-server** | In-memory MongoDB for isolated tests |

### Test Structure

```
backend/tests/
├── unit/              # Pure logic & utility tests
│   ├── models/        # Schema validation tests
│   ├── middleware/     # Auth, role, error handler tests
│   ├── controllers/   # Controller logic tests
│   └── services/      # Service layer tests
├── integration/       # Cross-component tests with real DB
│   ├── auth.routes.test.js
│   ├── rbac.routes.test.js
│   ├── user.routes.test.js
│   └── notification.routes.test.js
├── e2e/               # Full API workflow tests
│   ├── auth.test.js
│   ├── group.test.js
│   └── meeting.test.js
└── helpers/           # Shared test utilities
    ├── setupEnv.js    # Environment setup
    ├── db.js          # In-memory DB connection
    ├── app.js         # Express app instance
    ├── auth.js        # Auth helper functions
    └── factories.js   # Test data factories
```

### Running Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run coverage
```

Tests use `NODE_ENV=test` and do **not** require a real MongoDB instance (uses `mongodb-memory-server`).

---

## Deployment

### Build

```bash
# Build frontend
cd frontend && npm run build

# Output: frontend/dist/ - ready to serve via any static file server
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `COOKIE_SECURE=true` (HTTPS required)
- [ ] Configure MongoDB connection string (Atlas or self-hosted)
- [ ] Set up SMTP for email notifications
- [ ] Configure CORS (`CLIENT_ORIGIN`)
- [ ] Enable rate limiting
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring (logs, uptime)
- [ ] Enable CSP and security headers

### Deployment Options

1. **VPS/Cloud VM** — Deploy backend + MongoDB on a single VM, frontend via Nginx
2. **Platform-as-a-Service** — Render, Railway, or Fly.io for backend; Vercel/Netlify for frontend
3. **Docker** — Containerize both services with Docker Compose
4. **MongoDB Atlas** — Managed database service

---

## Roadmap

### Phase 1 — Quick Wins ✅
- Remove Monaco Editor → replace with Prism.js
- Remove Command Palette
- Remove Task Timeline View
- Replace "AI" branding with honest quality checklist

### Phase 2 — Consolidation ✅
- Merge dual feedback systems into single Project.feedback array
- Merge announcements into notifications (broadcast flag)
- Consolidate three file systems into unified File model
- Unify three request models into generic Request model

### Phase 3 — Architecture Cleanup ✅
- Remove Architecture Canvas (tldraw)
- Add structured logging (Winston)
- Security improvements (CSP, CSRF, file validation)
- Remove pre-approved student registry (optional config)

### Phase 4 — Performance & Enhancements 🏗️
- GitHub auto-sync (cron job + webhooks) — **In Progress**
- Task dependencies & Gantt chart
- Redis caching layer
- Database indexing & query optimization
- Configurable grading templates
- Peer review in evaluation

### Phase 5 — High-Value Features ⬜
- Discussion/comments system with @mentions
- Proposal version history
- PDF export & report generation
- Unified calendar with iCal export
- Milestone tracking with progress bars
- Notification grouping & preferences
- Skill matching for group formation

### Phase 6 — Polish & Long-Term ⬜
- Dark mode theme
- Mobile responsive enhancements
- PWA support
- Template library (proposals/reports)
- Comprehensive test suite (80%+ coverage)
- Performance monitoring & optimization

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code patterns (linter configs are set up)
- Write tests for new features and bug fixes
- Update documentation for API changes
- Use structured logging (Winston) for backend
- Maintain the monorepo structure
- Add migration scripts for schema changes to existing data

---

## License

This project is developed as a Final Year Project Management System for academic use.

---

*Last updated: June 2026*

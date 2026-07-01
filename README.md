# 💼 Employee Resource Manager (ERM)

> **Empowering Enterprise Workforce Efficiency** – A high-performance, modern, and beautiful full-stack human capital and project resource management platform. Built on a container-first architecture using **React 19 + Vite**, **Spring Boot 3 (Java 21)**, **PostgreSQL 16**, and **TanStack Query 5**.

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot 3" />
  <img src="https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/TanStack_Query-5.0-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query 5" />
</p>

---

## ⚡ Main Modules & Feature Matrix

The platform provides role-based access control (RBAC) across three primary authorization tiers: **Admin**, **Team Lead / Sub Lead**, and **Employee**.

| Capability | Module Description | Status | Tiers |
| :--- | :--- | :---: | :---: |
| **Secure Authentication** | Stateless JWT authentication with secure httpOnly cookie-based refresh cycle. | 🔐 Active | All |
| **Org Structure Management** | Complete CRUD operations for Employees, Teams, and departmental mappings. | 👥 Active | Admin |
| **Project Tracking** | Project provisioning, owner/lead assignment, budget/color coding, and member allocation. | 📁 Active | Admin, Leads |
| **Task Lifecycle (Sprint)** | Stage, assign, transfer, and review tasks with real-time ETA extension requests. | 📋 Active | All |
| **Interactive Timesheets** | Log daily hours, categorize work (Story, Bug, Meeting, Break), and manage ETA warnings. | ⏱️ Active | All |
| **Attendance & KPIs** | Live clock-in/out dashboard tracking daily hours, metrics, and KPI scorecards. | 📊 Active | All |
| **Meeting Scheduler** | Schedule team meetings, map attendees, and link meeting logs directly to timesheets. | 📅 Active | All |
| **Admin Alerts & Approvals** | Unified approval center for manager reviews, task handoffs, and ETA extensions. | 🔔 Active | Admin, Leads |

---

## 🏗️ System Architecture

ERM utilizes a modern decoupled service-oriented architecture ensuring high scalability, data isolation, and smooth state updates:

```mermaid
graph TD
    subgraph Client ["Frontend Client (React 19 + Vite)"]
        UI["UI View Components (Tailwind & custom CSS)"]
        State["State Management & Contexts (AppContext)"]
        Query["TanStack Query (Cache & Mutators)"]
        API["HTTP Client (Axios Service Wrapper)"]
    end

    subgraph Service ["Backend Core Service (Spring Boot 3)"]
        Controller["REST Controllers (v1 APIs)"]
        Security["JWT Security & RBAC Handler"]
        BizLogic["Domain Service Layer"]
        DataLayer["Spring Data JPA Repository"]
    end

    subgraph Infrastructure ["Data & Infrastructure Tiers"]
        DB[(PostgreSQL Database)]
        SMTP[SMTP Email Mailpit Server]
        Storage[AWS S3 / MinIO File Repository]
    end

    UI --> State
    State --> Query
    Query --> API
    API -->|Secure Cookies & HTTPS| Controller
    Controller --> Security
    Security --> BizLogic
    BizLogic --> DataLayer
    DataLayer --> DB
    BizLogic --> SMTP
    BizLogic --> Storage
```

---

## 🚀 Quick Start & Development Environment

### Method A: Single-Command Local Sandbox (Recommended)

ERM comes pre-configured with a multi-container Docker Compose file bootstrapping the UI, Spring Boot API, PostgreSQL instance, and a Mailpit SMTP inbox.

```bash
# 1. Clone the project files
git clone https://github.com/ritesh-prajan/Employee-Resource-Manager.git
cd Employee-Resource-Manager

# 2. Spin up the entire environment (builds image triggers and DB migrations)
docker compose up --build
```

Once ready, access the services at their target URLs:

*   **Employee Resource Dashboard (UI):** [http://localhost:5173](http://localhost:5173)
*   **Spring Backend REST Endpoint:** [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
*   **Mailpit SMTP Web Portal:** [http://localhost:8025](http://localhost:8025)

---

### Method B: Manual Local Setup

If running without Docker, follow these steps:

#### Backend Infrastructure Setup
Ensure **Java 21 JDK** and **PostgreSQL 16** are active on your system.

```bash
# 1. Access the database console and provision the target DB
psql -U postgres -c "CREATE DATABASE employeemanager;"

# 2. Navigate to the backend directory and launch the Boot task
cd employeemanager-elite
./gradlew bootRun
```

#### Frontend Client Setup
Requires **Node.js 20+** environment.

```bash
# 1. Return to the root directory
cd ..

# 2. Install dependencies & launch Vite Development Server
npm install
npm run dev
```

---

## 📂 Codebase Directory Blueprint

```text
Employee-Resource-Manager/
├── src/                          # Vite Client Application
│   ├── components/               # UI Modular Components
│   │   ├── forms/                # Entry Forms (CreateTaskModal, ManualTimeEntryModal...)
│   │   ├── timesheets/           # Classic, Tree, and Modern calendar panels
│   │   └── ui/                   # Shared design components (SearchableSelect...)
│   ├── context/                  # Context State Providers (AppContext, ToastContext...)
│   ├── hooks/                    # TanStack Query custom hooks
│   ├── pages/                    # Domain routing folders (Admin, Employee, Lead)
│   ├── services/                 # REST API services (api.js, taskService, timesheetService)
│   └── index.css                 # Core CSS design variables & Liquid styling
│
├── employeemanager-elite/        # Spring Boot Server Application
│   ├── src/main/java/com/elite/employeemanager/
│   │   ├── auth/                 # JWT Tokens, Security contexts & Filter Chains
│   │   ├── employee/             # Employee resources, directory operations & credentials
│   │   ├── team/                 # Dynamic team groups, scopes & lead mappings
│   │   ├── project/              # Project constraints & allocations
│   │   ├── task/                 # Tasks tracking, comments, attachments & history
│   │   ├── timesheet/            # Daily timesheets, work category, status validations
│   │   └── attendance/           # Clock-in/out tracking
│   └── build.gradle              # Server dependencies & Gradle packaging scripts
│
├── API_CONTRACT.md               # Backend Swagger API contract details
├── docker-compose.yml            # Docker orchestration configuration
└── README.md                     # Project documentation overview
```

---

## 🔧 Environment Configurations

The application reads context variables dynamically. Override the defaults using a `.env` file in the root or set them directly in your shell environment:

| Property Name | Purpose | Production Default / Recommended |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection URL. | `jdbc:postgresql://localhost:5432/employeemanager` |
| `SPRING_DATASOURCE_USERNAME` | Database username credentials. | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password credentials. | `postgres` |
| `JWT_SECRET` | Cryptographic secret for signing tokens. | *Keep it minimum 256-bit hash* |
| `JWT_EXPIRATION_MS` | Access token time-to-live. | `900000` (15 Minutes) |
| `JWT_REFRESH_EXPIRATION_MS` | Refresh token time-to-live. | `604800000` (7 Days) |
| `AWS_ACCESS_KEY_ID` | Object storage provider access key ID. | *Your AWS / MinIO Access ID* |
| `AWS_SECRET_ACCESS_KEY` | Object storage provider secret key. | *Your AWS / MinIO Secret Key* |

---

## 🧪 Testing Strategy

The client features comprehensive unit and integration testing built using **Vitest** and **Mock Service Worker (MSW)**, ensuring network-level interception without real database hits:

```bash
# Execute local unit-tests
npm run test

# Launch and view code coverage results
npm run test:coverage
```

---

## 🤝 Contributing & Standards

1. Create a descriptive Feature Branch: `git checkout -b feature/cool-new-feature`.
2. Adhere to the established Linting & Prettier standard format.
3. Write matching unit tests inside the `src/tests` directory.
4. Ensure all test blocks pass successfully before opening a Pull Request (PR).

---

## 📝 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

© 2026 **Ritesh Prajan** & Contributors. All rights reserved.

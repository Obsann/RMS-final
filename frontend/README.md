<p align="center">
  <h1 align="center">🏢 Resident Management System</h1>
  <p align="center">
    A modern, role-based property management dashboard built with React, TypeScript, and Tailwind CSS.
    <br />
    Manage residents, employees, maintenance requests, digital IDs, and more — all from a unified interface.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Role-Based Access](#-role-based-access)
- [Available Scripts](#-available-scripts)
- [Roadmap](#-roadmap)
- [Contributors](#-contributors)
- [License](#-license)

---

## 🧭 Overview

The **Resident Management System (RMS)** is a comprehensive web application designed for property and condominium administrators to efficiently manage residents, employees, maintenance operations, and digital identification — all through a clean, role-segmented dashboard interface.

The application implements **Role-Based Access Control (RBAC)** with four distinct user roles, each with tailored views and permissions. The UI is designed with a mobile-first approach and supports **bilingual localization** (English / Amharic).

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login with role selection
- Route-level access control via `AuthGuard` component
- Context-based session management

### 👤 Role-Specific Dashboards
| Role | Dashboard Features |
|------|-------------------|
| **Admin** | Full system overview, resident/employee CRUD, job assignment, reports, notifications |
| **Special Employee** | Team management, job delegation, request triage, digital ID workflow |
| **Employee** | Assigned job tracking, task completion, notification center |
| **Resident** | Service requests, profile management, digital ID application, family dependents |

### 🛠 Core Modules
- **Resident Management** — Register, view, edit, and deactivate residents with full profile views
- **Employee Management** — Manage regular and special employees, assign categories
- **Job/Task Management** — Create, assign, track, and verify maintenance jobs
- **Request Handling** — Maintenance requests and complaints with status tracking
- **Digital ID System** — End-to-end digital ID issuance workflow (request → approve → assign → issue)
- **Notification Center** — Real-time notification system with read/unread states per role
- **Reports & Analytics** — Employee performance metrics, job completion rates, charts
- **Bilingual Support** — Full English/Amharic UI localization via `LanguageContext`

### 🎨 UI/UX
- Responsive sidebar navigation with role-aware menu items
- Reusable component library built on Radix UI primitives
- Toast notifications via Sonner
- Modal dialogs, status badges, and data tables
- Clean, modern design with Tailwind CSS utility classes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [React 18](https://react.dev/) with JSX/TSX |
| **Language** | TypeScript + JavaScript |
| **Build Tool** | [Vite 6](https://vite.dev/) with SWC |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) |
| **Routing** | [React Router DOM](https://reactrouter.com/) (v6, `createBrowserRouter`) |
| **UI Primitives** | [Radix UI](https://www.radix-ui.com/) (30+ components) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.dev/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **State Management** | React Context API (`AuthContext`, `LanguageContext`, `DigitalIDContext`, `NotificationContext`) |

---

## 📁 Project Structure

```
Resident Management System UI/
├── index.html                      # Entry HTML
├── package.json                    # Dependencies & scripts
├── vite.config.ts                  # Vite configuration with path aliases
├── tsconfig.json                   # TypeScript compiler options
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS plugins
│
└── src/
    ├── main.tsx                    # Application entry point
    ├── App.tsx                     # Root component, router, auth context
    ├── index.css                   # Global styles & CSS variables
    │
    ├── components/
    │   ├── layout/
    │   │   └── DashboardLayout.jsx # Shared sidebar + header layout
    │   ├── ui/                     # 50+ reusable UI components (Radix-based)
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx
    │   │   ├── select.tsx
    │   │   ├── table.tsx
    │   │   └── ...
    │   └── figma/
    │       └── ImageWithFallback.tsx
    │
    ├── contexts/
    │   ├── LanguageContext.jsx      # i18n provider (EN/AM)
    │   ├── DigitalIDContext.jsx     # Digital ID workflow state
    │   └── NotificationContext.jsx  # Per-role notification state
    │
    └── pages/
        ├── Welcome.jsx             # Landing page
        ├── Login.jsx               # Login with role selection
        ├── Register.jsx            # Resident registration
        ├── admin/                  # 10 admin pages
        │   ├── Dashboard.jsx
        │   ├── Residents.jsx
        │   ├── ResidentProfile.jsx
        │   ├── Employees.jsx
        │   ├── SpecialEmployees.jsx
        │   ├── Jobs.jsx
        │   ├── Requests.jsx
        │   ├── DigitalID.jsx
        │   ├── Notifications.jsx
        │   └── Reports.jsx
        ├── special-employee/       # 8 special employee pages
        ├── employee/               # 2 employee pages
        └── resident/               # 4 resident pages
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/resident-management-system.git
cd resident-management-system

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at **http://localhost:3000**.

---

## 🔑 Role-Based Access

To explore different dashboards, log in with any email/password and select a role:

| Role | Login Name | Dashboard URL |
|------|-----------|---------------|
| **Admin** | Obsan Habtamu | `/admin/dashboard` |
| **Special Employee** | Samuel Tolasa | `/special-employee/dashboard` |
| **Employee** | Samuel Fayisa | `/employee/dashboard` |
| **Resident** | Samson Tadesse | `/resident/dashboard` |

> **Note:** Authentication is currently client-side only (mock). Any email/password combination will work — the selected **role** determines which dashboard you access.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server on port 3000 |
| `npm run build` | Create optimized production build in `/build` |

---

## 🗺 Roadmap

- [ ] **Backend Integration** — RESTful API with Node.js/Express and MongoDB
- [ ] **Persistent Authentication** — JWT-based auth with refresh tokens
- [ ] **Real-time Notifications** — WebSocket integration for live updates
- [ ] **File Uploads** — Profile pictures and document attachments
- [ ] **Advanced Reports** — Exportable PDF/Excel reports
- [ ] **Dark Mode** — Theme toggle with system preference detection
- [ ] **Unit & Integration Tests** — Jest + React Testing Library coverage

---

## 👥 Contributors

| Name | Role |
|------|------|
| Obsan Habtamu | Project Lead / Admin |
| Samuel Tolasa | Developer |
| Samuel Fayisa | Developer |
| Samson Tadesse | Developer |
| Olyad Amanuel | Developer |
| Ramadan Oumer | Developer |
| Semira Ambisa | Developer |

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with Obsann using React, TypeScript & Tailwind CSS
</p>
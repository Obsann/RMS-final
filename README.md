<p align="center">
  <h1 align="center">🏢 Resident Management System (RMS)</h1>
  <p align="center">
    A comprehensive, secure, and role-based full-stack solution designed for Kebele and property administrators.
    <br />
    Manage residents, employees, maintenance requests, jobs, and digital IDs seamlessly from a unified MERN stack dashboard.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Structure](#-architecture--structure)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Contributors](#-contributors)
- [License](#-license)

---

## 🧭 Overview

The **Resident Management System (RMS)** is a full-stack web application tailored for real-world municipal (Kebele) and residential property workflows. It unifies operations that typically exist in separate silos: user identity verification, service request tracking, employee job dispatching, and digital ID issuance.

Featuring a fully integrated Node.js backend with MongoDB and a polished bilingual (English/Amharic) React frontend, the platform provides strong authentication (including Google OAuth), rigorous data validation, and comprehensive automated audit logging.

---

## ✨ Key Features

### 🔐 Robust Authentication & Security
- **Multiple Login Methods**: Traditional email/password alongside secure **Google OAuth 2.0** integration.
- **Admin Approval Workflow**: All new resident registrations (whether local or via Google) are placed in a 'pending' state until verified by an administrator.
- **JWT Sessions**: Secure token-based authentication with Express middleware.
- **Data Protection**: Implements `helmet`, `express-mongo-sanitize`, rate limiting, and password hashing (`bcrypt`).

### 🛠 Core Modules
- **Resident Hub**: Complete profiles including family dependents, emergency contacts, and attached documents.
- **Employee Dispatch**: Track staff workloads, assign jobs categorised by department, and monitor completion status.
- **Request & Complaint Engine**: Residents can submit issues, which are reviewed and converted directly into actionable Jobs for employees.
- **Digital ID Workflow**: End-to-end QR-based digital ID issuance. (Request → Admin Approval → Generation → Verification).
- **Communication & Announcements**: Role-targeted and system-wide broadcast notifications.
- **System Audit Logs**: Automated capturing of all `CREATE`, `UPDATE`, and `DELETE` events mapped to acting users.

### 🎨 Premium UI/UX
- Responsive sidebar navigation contextualized entirely by user role.
- Native bilingual support (English / Amharic).
- Dozens of Radix UI primitives ensuring accessibility.

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend Framework** | React 18, Vite |
| **Frontend Styling** | Tailwind CSS 3.4, Radix UI Primitives, Lucide Icons |
| **Frontend State / i18n** | React Context (`LanguageContext`, `AuthContext`), React Router DOM |
| **Backend Framework** | Express.js, Node.js |
| **Database & ORM** | MongoDB, Mongoose |
| **Auth & Security** | Passport.js (Google OAuth), JWT, bcrypt, Helmet, express-rate-limit |
| **File Handling** | Multer |

---

## 📁 Architecture & Structure

The repository represents a unified monorepo structure.

```text
rms-unified/
├── backend/                  # Express.js REST API
│   ├── config/               # DB, Passport.js, Logger configs
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Auth guards, validators, rate limiters, audit logs
│   ├── models/               # Mongoose schemas (User, Job, Request, DigitalId, etc.)
│   ├── routes/               # API endpoints
│   ├── uploads/              # Local storage for documents & profile photos
│   └── server.js             # Application entry point
│
└── frontend/                 # React UI
    ├── src/
    │   ├── components/       # Reusable UI parts & layouts
    │   ├── contexts/         # App state & localization
    │   ├── pages/            # View layer (Admin, Resident, Employee screens)
    │   ├── utils/            # Shared logic (api.js fetch wrappers)
    │   └── App.tsx           # Router and top-level providers
    ├── vite.config.ts        # Vite configuration
    └── tailwind.config.js    # Tailwind themes & colors
```

---

## 🔑 Role-Based Access Control (RBAC)

The system enforces strict multi-tenancy rules across both the UI and API layers.

| Role | Permissions & Capabilities |
|------|---------------------------|
| **Admin** | Full system control. Approve/reject new users, manage staff, oversee all jobs and requests, view global reports and audit logs. |
| **Special Employee** | Managerial tier. Triage requests, delegate jobs to regular employees, review digital ID applications. |
| **Employee** | Operational tier. Receive assigned tasks, update job statuses, communicate completion notes. |
| **Resident** | End-user tier. Submit maintenance requests/complaints, apply for digital IDs, manage personal & dependent profiles. |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Google Cloud Console** (For OAuth Client ID and Secret)

### 1. Backend Setup
```bash
cd backend
npm install
```
Configure your environment variables (see below), then start the server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will accessible at `http://localhost:3000` and automatically proxies `/api` calls to the backend on `http://localhost:5000`.

---

## ⚙️ Environment Variables

Create `.env` files in both backend and frontend directories.

**`backend/.env`**
```env
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/your_db

# Security & Sessions
JWT_SECRET=your_super_secret_jwt_key
SESSION_SECRET=your_express_session_secret

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend App URL (for OAuth Callbacks and CORS)
FRONTEND_URL=http://localhost:3000
```

---

## 👥 Contributors

- **Obsan Habtamu** — Project Lead and Developer
- **Samuel Tolasa** — Developer
- **Samuel Fayisa** — Developer
- **Samson Tadesse** — Developer
- **Olyad Amanuel** — Developer
- **Ramadan Oumer** — Developer
- **Semira Ambisa** — Developer

---

## 📄 License

This project is licensed under the **MIT License**.

<p align="center">
  System unified & integrated by Obsann using the MERN Stack.
</p>

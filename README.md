# Mitra-Mandal (મિત્ર-મંડળ) — Group Fund & Loan Management Web App

A production-quality full-stack **MERN** web application designed for group fund collections, expense management, reducing-interest member loan management, EMI schedules, and transparent financial reporting.

---

## 📂 Project Architecture

```
MITRA-MANDAL/
├── backend/                  # Backend Node/Express API
│   ├── src/
│   │   ├── config/           # Database Connection
│   │   ├── constants/        # Enums & Status Codes
│   │   ├── controllers/      # Route Handlers
│   │   ├── middleware/       # Auth, Authorization & Error Middlewares
│   │   ├── models/           # Mongoose Models
│   │   ├── routes/           # Express Routes
│   │   ├── services/         # Loan Engine, Fund Ledger & Contribution Services
│   │   ├── seed/             # Database Seeder Script
│   │   └── server.js
│   └── tests/                # Vitest Unit Tests
├── frontend/                 # Frontend React Application
│   ├── src/
│   │   ├── components/       # Reusable UI (MoneyCard, StatusBadge, LoanProgress, EMIList)
│   │   ├── context/          # Auth Context
│   │   ├── pages/            # Public, Member & Admin Pages
│   │   ├── services/         # Axios API Service
│   │   └── utils/            # Indian Currency & Date Formatters
│   └── vite.config.js
└── README.md
```

---

## 🚦 Quick Start Guide

### 1. Start the Backend Server

Open **Terminal 1**:
```powershell
cd c:\Users\jigne\OneDrive\Desktop\PROJECT\MAJOR_PROJECTS\MITRA-MANDAL\backend

# 1. Seed sample data (15 members, loans, contributions & admin account)
npm run seed

# 2. Start backend server
npm run dev
```

### 2. Start the Frontend Application

Open **Terminal 2**:
```powershell
cd c:\Users\jigne\OneDrive\Desktop\PROJECT\MAJOR_PROJECTS\MITRA-MANDAL\frontend

# Start Vite development server
npm run dev
```

---

## 🔑 Test Credentials

- **Admin Account**: `admin@mitramandal.com` / `adminpassword`
- **Member Account**: `member1@mitramandal.com` / `memberpassword`

# Academic Management System — Backend API
> REST API built with **Node.js + Express** that handles the business logic and data layer for the Academic Management Mobile System.

![Node](https://img.shields.io/badge/Node.js-20.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![Firebase](https://img.shields.io/badge/Firebase-Admin-orange)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

---

## Table of Contents
- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Git Workflow](#git-workflow)
- [Team Members](#team-members)

---

## 🗺️ Overview

This repository contains the **backend API** of the Academic Management System. It runs on port `3000` and connects to **Firebase Firestore** as the database.

| Repository | What it contains | Port |
|------------|-----------------|------|
| **Mobile** | Ionic + Angular app (UI) | 8100 |
| **Backend (this repo)** | Node.js + Express API (logic & data) | 3000 |

---

## Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime environment |
| Express | 4.x | Web framework / REST API |
| Firebase Admin SDK | 12.x | Connect to Firestore from server |
| dotenv | 16.x | Environment variables management |
| cors | 2.x | Enable cross-origin requests |
| nodemon | 3.x | Auto-restart server on file changes (dev) |

---

## Prerequisites

Make sure you have the following installed before cloning:

### 1. Node.js (LTS version)
```bash
# Download from: https://nodejs.org/en/download
node --version   # should show v20.x.x or higher
npm --version    # should show 10.x.x or higher
```

### 2. Git
```bash
# Download from: https://git-scm.com/download/win
git --version
```

### 3. Visual Studio Code (recommended)
Download from: https://code.visualstudio.com/download

---

## Installation

### Step 1 — Clone the repository
```bash
git clone https://github.com/UNAPLANNER/Ionic-project-academic-system-Backend.git
cd Ionic-project-academic-system-Backend
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Set up environment variables (see section below)

### Step 4 — Run the server
```bash
npm run dev
# Server starts at http://localhost:3000
```

---

## Environment Variables

Create a `.env` file in the **root of the project** (same level as `package.json`).

> **NEVER commit the `.env` file to GitHub.** It is already listed in `.gitignore`.
> Ask the team leader for the actual values.

```env
# Server
PORT=3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=academic-system-una
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@academic-system-una.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

### How to get the Firebase Admin credentials:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the project `academic-system-una`
3. Go to **Project Settings → Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file
6. Copy the values from the JSON into your `.env` file

---

## Running the Server

### Development mode (with auto-restart)
```bash
npm run dev
# Uses nodemon — server restarts automatically on file changes
# Running at: http://localhost:3000
```

### Production mode
```bash
npm start
# Uses node directly
```

### Verify the server is running
Open your browser or use Thunder Client / Postman:
```
GET http://localhost:3000/
```
Expected response:
```json
{ "message": "API Sistema Academico funcionando" }
```

---

## Project Structure

```
Ionic-project-academic-system-Backend/
├── src/
│   ├── config/             ← Firebase Admin initialization
│   ├── controllers/        ← Business logic per module
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── course.controller.js
│   │   └── evaluation.controller.js
│   ├── middleware/         ← Auth middleware, error handling
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/             ← Data models / schemas
│   │   ├── student.model.js
│   │   ├── course.model.js
│   │   └── evaluation.model.js
│   ├── routes/             ← API route definitions
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── course.routes.js
│   │   └── evaluation.routes.js
│   └── index.js            ← App entry point
├── .env                    ← Environment variables (NOT in GitHub)
├── .env.example            ← Example env file (safe to commit)
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:3000`

### Auth
| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |

### Students
| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| GET | `/api/students` | Get all students | Yes |
| GET | `/api/students/:id` | Get student by ID | Yes |
| POST | `/api/students` | Create new student | Yes (Admin) |
| PUT | `/api/students/:id` | Update student | Yes (Admin) |
| DELETE | `/api/students/:id` | Delete student | Yes (Admin) |

### Courses
| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| GET | `/api/courses` | Get all courses | Yes |
| GET | `/api/courses/:id` | Get course by ID | Yes |
| POST | `/api/courses` | Create new course | Yes (Admin/Teacher) |
| PUT | `/api/courses/:id` | Update course | Yes (Admin/Teacher) |
| DELETE | `/api/courses/:id` | Delete course | Yes (Admin) |

### Evaluations
| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| GET | `/api/evaluations` | Get all evaluations | Yes |
| GET | `/api/evaluations/student/:id` | Get evaluations by student | Yes |
| POST | `/api/evaluations` | Register evaluation | Yes (Teacher) |
| PUT | `/api/evaluations/:id` | Update evaluation | Yes (Teacher) |
| DELETE | `/api/evaluations/:id` | Delete evaluation | Yes (Admin) |

### Dashboard
| Method | Endpoint | Description | Auth required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/metrics` | Get general metrics | Yes |
| GET | `/api/dashboard/performance` | Get performance by course | Yes |

> Full API contracts with request/response examples are in `/docs/api-contracts/`

---

## Git Workflow

### Branch structure
```
main          ← Stable, reviewed code only
develop       ← Team integration branch
feature/xxx   ← One branch per feature
```

### Working on a new feature
```bash
# 1. Update develop
git checkout develop
git pull origin develop

# 2. Create your branch
git checkout -b feature/feature-name

# 3. Work on your code...

# 4. Push your changes
git add .
git commit -m "feat: description of what you did"
git push origin feature/feature-name

# 5. Open a Pull Request on GitHub targeting develop
# 6. Request a Code Review from a teammate
```

### Commit convention
| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `refactor:` | Code refactoring |
| `test:` | Tests |
| `ci:` | CI/CD changes |

---

## Project Repositories

- **Mobile:** [Ionic-project-academic-system-Mobile](https://github.com/UNAPLANNER/Ionic-project-academic-system-Mobile)
- **Backend (this repo):** [Ionic-project-academic-system-Backend](https://github.com/UNAPLANNER/Ionic-project-academic-system-Backend)

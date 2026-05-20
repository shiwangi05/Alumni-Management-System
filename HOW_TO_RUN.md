# 🎓 Alumni Management System — Setup Guide

> Follow these steps **in order** to run the project on any machine.

---

## 📋 Prerequisites (Install These First)

### 1. Node.js (v18 or above)
- Download: https://nodejs.org/
- After install, verify:
```bash
node -v
npm -v
```

### 2. MongoDB Community Server
- Download: https://www.mongodb.com/try/download/community
- During installation, **check "Install MongoDB as a Service"** so it runs automatically.
- After install, verify:
```bash
mongosh
```
- If `mongosh` opens a shell, MongoDB is running. Type `exit` to close.

### 3. Git (optional, if cloning from GitHub)
- Download: https://git-scm.com/downloads

---

## 🚀 Step-by-Step Setup

### Step 1 — Open Terminal & Navigate to Project Folder

```bash
cd path/to/Shiwangi
```

---

### Step 2 — Install Backend Dependencies

```bash
cd server
npm install
```

This installs: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `express-validator`

---

### Step 3 — Seed the Admin Account

```bash
node seed.js
```

This creates the default admin account:
- **Email:** `admin@alumni.com`
- **Password:** `admin123`

---

### Step 4 — Start the Backend Server

```bash
node server.js
```

You should see:
```
Server running on port 5000
MongoDB Connected: localhost
```

> ⚠️ **Keep this terminal open.** Open a **new terminal** for the next step.

---

### Step 5 — Install Frontend Dependencies (New Terminal)

```bash
cd path/to/Shiwangi/client
npm install
```

This installs: `react`, `react-dom`, `react-router-dom`, `axios`, `vite`, and other dev dependencies.

---

### Step 6 — Start the Frontend Dev Server

```bash
npm run dev
```

You should see:
```
VITE v7.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

### Step 7 — Open in Browser

Go to: **http://localhost:5173**

---

## 🧪 Test the App

| Role | How to Access |
|------|--------------|
| **Admin** | Login with `admin@alumni.com` / `admin123` |
| **Student** | Register a new account → select "Student" |
| **Alumni** | Register a new account → select "Alumni" |

---

## 📁 Quick Reference — All Commands in Order

```bash
# === BACKEND (Terminal 1) ===
cd server
npm install
node seed.js
node server.js

# === FRONTEND (Terminal 2) ===
cd client
npm install
npm run dev
```

---

## ⚙️ Environment Config

The file `server/.env` contains:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/alumni_management
JWT_SECRET=alumni_mgmt_super_secret_key_2026
JWT_EXPIRE=7d
```

If MongoDB is on a different machine/port, update `MONGO_URI` accordingly.

---

## 🛑 Troubleshooting

| Problem | Fix |
|---------|-----|
| `mongosh` not found | MongoDB isn't installed or not in PATH |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB service isn't running — start it from Services (Windows) |
| `next is not a function` | Pull the latest code — this was a Mongoose compatibility fix |
| Port 5000 already in use | Change `PORT` in `server/.env` |
| Port 5173 already in use | Vite will auto-pick the next port |
| `npm install` fails | Try `npm install --legacy-peer-deps` |

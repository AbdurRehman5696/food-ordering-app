# 🍔 CravingBites — Full-Stack Ordering Application

An animated full-stack food delivery application built for teaching **Linux & PM2 deployment workflows** (cloning, dependency management, building assets, PM2 process supervision, and Nginx reverse proxying).

![CravingBites Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%7C%20Node.js%20%7C%20PostgreSQL%20%7C%20PM2%20%7C%20Nginx-orange?style=for-the-badge)

---

## 🎯 What Students Learn in this Project

1. **Git Workflow**: Cloning remote repositories to Linux servers and pulling updates.
2. **Environment & Dependencies**: Setting up Node.js, npm, and environment variables (`.env`).
3. **Database Setup**: PostgreSQL setup, Prisma ORM migrations, and database seeding.
4. **Process Management with PM2**:
   - Keeping the backend alive 24/7 without open terminals.
   - Using `ecosystem.config.js` for process declaration.
   - Managing lifecycle: `pm2 start`, `pm2 reload`, `pm2 logs`, `pm2 status`.
   - Configuring systemd auto-restart on OS boot (`pm2 startup`, `pm2 save`).
5. **Production Build & Nginx**:
   - Compiling React via `npm run build`.
   - Reverse proxying traffic: `/` served from static build, `/api/` forwarded to PM2 on port 5000.

---

## 📱 App Highlights

- **Auth**: Registration, Login, password hashing with `bcryptjs`, and JWT tokens.
- **⚡ 1-Click Demo Login (`student@example.com` / `student123`)** for immediate classroom testing.
- **Menu Catalog**: Category filter pills (Burgers, Pizzas, Drinks, Desserts) and real-time search.
- **Cart & Animated Order Tracker**: Slide-out cart, live pricing, and visual multi-stage status progress bar (`PLACED` ➔ `PREPARING` ➔ `ON THE WAY` ➔ `DELIVERED`).

---

## 🚀 Quick Deployment Guide with PM2

### 1. Clone the repository on the server
```bash
git clone https://github.com/AbdurRehman5696/food-ordering-app.git
cd food-ordering-app
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
node src/seed.js
cd ..
```

### 3. Frontend Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 5. Check Live Status & Logs
```bash
pm2 status
pm2 logs cravingbites-backend
```

---

## 📖 Complete Lecture & Step-by-Step Guide

For the full student lecture guide with Nginx setup, database creation, and zero-downtime updates:
👉 **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)**

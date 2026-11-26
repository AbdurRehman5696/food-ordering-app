# 🍔 CravingBites — Full-Stack Ordering Application

An animated full-stack food delivery application designed as a teaching resource for DevOps, cloud deployment, and modern full-stack development.

![CravingBites Architecture](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20PostgreSQL%20%7C%20Docker-orange?style=for-the-badge)

---

## 🌟 Application Features

- **Authentication System**:
  - Secure Registration & Login with `bcryptjs` password hashing and JWT (JSON Web Tokens).
  - Instant form validation with error feedback.
  - **⚡ 1-Click Demo Login (`student@example.com` / `student123`)** for immediate classroom testing.
- **Dynamic Catalog & Search**:
  - Real-time category filtering (Burgers, Pizzas, Drinks, Desserts).
  - Search by name or description.
- **Cart & Order Flow**:
  - Slide-out Cart Drawer with quantity adjusters.
  - Live calculations: Subtotal, Delivery Fee, Total.
  - Delivery address input & payment method selection.
  - **Animated Order Status Tracker**: Live visual simulation (`PLACED` ➔ `PREPARING` ➔ `ON THE WAY` ➔ `DELIVERED`).
- **DevOps Ready**:
  - Multi-stage Docker build for frontend (React + Nginx).
  - Optimized Node.js 20 Alpine container for backend.
  - PostgreSQL container with automatic healthchecks & persistent volume storage.
  - Nginx reverse-proxy routing frontend & backend via standard HTTP port `80`.

---

## 🏗️ Architecture

```
                       +-----------------------------------+
                       |        Client Browser (Port 80)   |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |     Nginx Web Server Container    |
                       |  - Serves compiled React app      |
                       |  - Reverse-proxies /api/ requests |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |    Node.js / Express Container    |
                       |             (Port 5000)           |
                       |  - JWT Authentication             |
                       |  - Products & Orders REST API     |
                       |  - Prisma ORM                     |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |       PostgreSQL Container        |
                       |             (Port 5432)           |
                       |  - Persistent storage volume      |
                       +-----------------------------------+
```

---

## 🚀 Quick Start (Docker Deployment)

The fastest and cleanest way for students to run the entire stack on their laptop or cloud server:

### 1. Clone the repository
```bash
git clone <YOUR-REPO-URL>
cd food-ordering-app
```

### 2. Launch with Docker Compose
```bash
docker compose up --build -d
```

### 3. Open in Browser
- **Frontend App**: [http://localhost](http://localhost)
- **API Healthcheck**: [http://localhost/api/health](http://localhost/api/health)

---

## 💻 Manual Local Development (Without Docker)

### Backend Setup:
```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run seed
npm run dev
```
*(Backend runs on `http://localhost:5000`)*

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:3000` and automatically proxies `/api` calls to port 5000)*

---

## 📚 Teaching Curriculum & Guides

For the full student step-by-step deployment guide (including VPS deployment, Nginx reverse proxy configuration, and SSL certificates), check out:
👉 **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)**

---

## 🧪 Quick Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Demo Student** | `student@example.com` | `student123` |
| **New User** | Create any new account via the **Sign Up** tab | Any 6+ char password |

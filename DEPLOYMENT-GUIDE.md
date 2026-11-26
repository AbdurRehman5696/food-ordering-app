# 📖 Student Full-Stack Deployment Guide

Welcome! This step-by-step curriculum is designed to guide students through deploying a modern full-stack web application (React + Node.js + PostgreSQL) from their local machine to a production server.

---

## 📑 Curriculum Outline

1. [Understanding the Full-Stack Components](#1-understanding-the-full-stack-components)
2. [Prerequisites](#2-prerequisites)
3. [Running Locally with Docker](#3-running-locally-with-docker)
4. [Deploying to a Cloud VPS (Ubuntu Linux)](#4-deploying-to-a-cloud-vps-ubuntu-linux)
5. [Configuring a Domain & SSL (HTTPS)](#5-configuring-a-domain--ssl-https)
6. [Troubleshooting & FAQ](#6-troubleshooting--faq)

---

## 1. Understanding the Full-Stack Components

A complete production deployment requires three distinct layers:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS | High-performance user interface, state management, animations |
| **Reverse Proxy** | Nginx | Serves static assets, routes `/api/` calls to backend, handles SSL |
| **Backend** | Node.js, Express.js | Business logic, authentication (JWT), order processing |
| **Database** | PostgreSQL + Prisma ORM | Relational data persistence (Users, Products, Orders) |

---

## 2. Prerequisites

Before starting, ensure you have:
1. **Git** installed on your machine (`git --version`).
2. **Docker Desktop** (or Docker Engine on Linux) installed and running.
3. A **GitHub account** to clone or fork the code.
4. *(For Cloud deployment)* An Ubuntu 22.04 / 24.04 VPS (AWS EC2, DigitalOcean, Hetzner, or Linode).

---

## 3. Running Locally with Docker

1. **Clone the code**:
   ```bash
   git clone <REPO-URL>
   cd food-ordering-app
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Start the containers**:
   ```bash
   docker compose up --build -d
   ```

4. **Verify container status**:
   ```bash
   docker compose ps
   ```
   You should see 3 containers running:
   - `cravingbites-frontend` (Port 80)
   - `cravingbites-backend` (Port 5000)
   - `cravingbites-postgres` (Port 5432)

5. **Test in your browser**:
   Navigate to `http://localhost`. Try creating an account, adding food items to the cart, and placing an order!

---

## 4. Deploying to a Cloud VPS (Ubuntu Linux)

Follow these steps to deploy on any standard Ubuntu cloud server:

### Step 4.1: Connect to your VPS via SSH
```bash
ssh root@YOUR_SERVER_IP
```

### Step 4.2: Install Docker & Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Step 4.3: Clone and Launch the Project
```bash
# Clone the repository
git clone <YOUR-REPO-URL> /var/www/food-ordering-app
cd /var/www/food-ordering-app

# Set production environment variables
cp .env.example .env

# Build and start services in the background
docker compose up --build -d
```

Your application is now live at `http://YOUR_SERVER_IP`!

---

## 5. Configuring a Domain & SSL (HTTPS)

In production, you never run plain HTTP. To configure free Let's Encrypt SSL:

1. **Point your domain's DNS A Record** to your VPS IP:
   - Type: `A`
   - Name: `order.yourdomain.com`
   - Value: `YOUR_SERVER_IP`

2. **Install Certbot on Host Nginx** (or use Certbot Docker container):
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d order.yourdomain.com
   ```

---

## 6. Troubleshooting & FAQ

### Q: "Port 80 is already in use"
**Fix**: Stop any existing web server running on port 80:
```bash
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### Q: "Database connection failed"
**Fix**: Check if PostgreSQL container is healthy:
```bash
docker compose logs postgres
```
Prisma will automatically retry connection during startup.

### Q: How do I view live application logs?
```bash
# All logs:
docker compose logs -f

# Backend logs only:
docker compose logs -f backend
```

### Q: How do I stop or reset everything?
```bash
# Stop containers:
docker compose down

# Stop and wipe database volume for a clean start:
docker compose down -v
```

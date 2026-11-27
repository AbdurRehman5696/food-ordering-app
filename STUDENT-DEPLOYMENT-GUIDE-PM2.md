# 🚀 Full-Stack Web Application Deployment Guide
### **React (Frontend) + Node.js Express (Backend) + PostgreSQL + PM2 + Nginx**

> **Author / Instructor:** DevOps & Cloud Engineering Masterclass  
> **Target Audience:** Students & Software Engineers  
> **Lab Architecture:** Bare Metal / Linux VPS (Ubuntu 22.04 / 24.04 LTS)

---

## 📑 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Prerequisites Checklist](#2-prerequisites-checklist)
3. [Step 1: Connecting to the Server & Installing Packages](#step-1-connecting-to-the-server--installing-packages)
4. [Step 2: Installing & Configuring PostgreSQL](#step-2-installing--configuring-postgresql)
5. [Step 3: Cloning the Application from GitHub](#step-3-cloning-the-application-from-github)
6. [Step 4: Configuring Environment Variables (.env)](#step-4-configuring-environment-variables-env)
7. [Step 5: Setting Up Backend & Database Migration](#step-5-setting-up-backend--database-migration)
8. [Step 6: Compiling the React Frontend for Production](#step-6-compiling-the-react-frontend-for-production)
9. [Step 7: Managing the Backend with PM2](#step-7-managing-the-backend-with-pm2)
10. [Step 8: Configuring Nginx (Web Server & Reverse Proxy)](#step-8-configuring-nginx-web-server--reverse-proxy)
11. [Step 9: Testing & Verifying the Deployment](#step-9-testing--verifying-the-deployment)
12. [Step 10: How to Update / Redeploy Code (Day-2 DevOps)](#step-10-how-to-update--redeploy-code-day-2-devops)
13. [PM2 Cheat Sheet & Troubleshooting](#pm2-cheat-sheet--troubleshooting)

---

## 1. Overview & Architecture

When deploying a production web application, we separate the static presentation layer from the dynamic API and the database:

```
[ Client Web Browser ]
         │
         │  Port 80 (HTTP) or 443 (HTTPS)
         ▼
 ┌────────────────────────────────────────────────────────┐
 │                      NGINX                             │
 │  • Serves React static files (frontend/dist)           │
 │  • Forwards /api/* requests to Node.js on port 5000    │
 └──────────────────────────┬─────────────────────────────┘
                            │  Internal Reverse Proxy
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │                   PM2 DAEMON                           │
 │  • Supervises Node.js Express API (Port 5000)          │
 │  • Restarts on crashes, system boots, and updates      │
 └──────────────────────────┬─────────────────────────────┘
                            │  Internal DB Connection
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │              POSTGRESQL DATABASE                       │
 │  • Stores Users, Menu Products, Orders (Port 5432)     │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites Checklist

Before starting, ensure you have:
- [x] A Linux VPS or Virtual Machine running Ubuntu (AWS EC2, DigitalOcean Droplet, Hetzner, etc.).
- [x] SSH access to your server (`ssh username@your-server-ip`).
- [x] A GitHub account and the repository URL.

---

## Step 1: Connecting to the Server & Installing Packages

Open your local terminal (PowerShell, macOS Terminal, or Linux terminal) and connect:
```bash
ssh root@YOUR_SERVER_IP
```

Update your package index and install essential tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential
```

Install **Node.js (v20 LTS)** and **npm**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installed versions:
```bash
node -v   # Should show v20.x
npm -v    # Should show v10.x
git --version
```

Install **PM2** globally on the system:
```bash
sudo npm install -g pm2
pm2 -v
```

---

## Step 2: Installing & Configuring PostgreSQL

Install PostgreSQL and its contrib packages:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```
For the EC2 security group, allow SSH only from your IP, and allow inbound HTTP (80)
and HTTPS (443) for visitors. Do not expose PostgreSQL (5432) or the Node API (5000)
to the public internet.

Log in to the PostgreSQL prompt:
```bash
sudo -u postgres psql
```

Run these SQL commands inside `psql` to create the database and user:
```sql
CREATE USER fooduser WITH ENCRYPTED PASSWORD 'MySecurePassword123!';
CREATE DATABASE food_order_db OWNER fooduser;
\q
```

---

## Step 3: Cloning the Application from GitHub

We will place the application in `/var/www/food-ordering-app`:
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

# Clone the repository
git clone https://github.com/AbdurRehman5696/food-ordering-app.git
cd food-ordering-app
```

---

## Step 4: Configuring Environment Variables (.env)

Navigate into the backend and create the `.env` file:
```bash
cd backend
cp .env.example .env
nano .env
```

Set the database connection string using the credentials created in Step 2:
```ini
PORT=5000
DATABASE_URL="postgresql://fooduser:MySecurePassword123!@localhost:5432/food_order_db?schema=public"
JWT_SECRET="PASTE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS"
CLIENT_URL="http://YOUR_SERVER_IP"
```
Press `CTRL + O`, then `ENTER` to save, and `CTRL + X` to exit `nano`.
Generate a secret with `openssl rand -base64 48`. Keep `backend/.env` on the server only.

---

## Step 5: Setting Up Backend & Database Migration

Inside `/var/www/food-ordering-app/backend`:
```bash
# Install backend dependencies
npm install

# Generate Prisma Client & apply database migrations
npx prisma generate
npx prisma migrate deploy

# Seed initial gourmet menu items & demo student account
node src/seed.js

# Return to root directory
cd ..
```

---

## Step 6: Compiling the React Frontend for Production

Vite compiles JSX, React components, and Tailwind CSS into high-performance static files:
```bash
cd frontend

# Install frontend dependencies
npm install

# Compile into optimized production bundle
npm run build
```
This command generates the `/var/www/food-ordering-app/frontend/dist` directory containing `index.html`, bundled JavaScript, and CSS.

Return to project root:
```bash
cd ..
```

---

## Step 7: Managing the Backend with PM2

The repository includes a ready-to-use `ecosystem.config.js` file.

### Start the backend service:
```bash
pm2 start ecosystem.config.js
```

### Check status:
```bash
pm2 status
```
You will see `cravingbites-backend` listed with status **online**.

### View real-time logs:
```bash
pm2 logs cravingbites-backend
```
*(Press `CTRL + C` to exit log streaming)*

### Enable Auto-Restart on Server Reboots:
```bash
pm2 startup systemd
```
PM2 will output a command starting with `sudo env PATH=...`. Copy and run that exact command, then save:
```bash
pm2 save
```

---

## Step 8: Configuring Nginx (Web Server & Reverse Proxy)

The EC2/PM2 Nginx config is stored at `deploy/nginx/food-ordering-app.conf`.
Install it under this exact site filename:
```bash
sudo cp deploy/nginx/food-ordering-app.conf /etc/nginx/sites-available/food-ordering-app
```

The config defaults to `server_name _;` for an EC2 public IP. For a domain, edit the
directive in the copied config before enabling it.

Enable the site and restart Nginx:
```bash
# Enable site configuration
sudo ln -s /etc/nginx/sites-available/food-ordering-app /etc/nginx/sites-enabled/food-ordering-app

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 9: Testing & Verifying the Deployment

1. Open your web browser and navigate to:
   ```
   http://YOUR_SERVER_IP
   ```
2. You will see the **CravingBites** animated food ordering interface!
3. Click **"⚡ 1-Click Demo Login"** (or register a new user).
4. Browse burgers, pizzas, and drinks, add items to the cart, and place an order.
5. Watch the live animated status progress bar advance (`PLACED` ➔ `PREPARING` ➔ `ON THE WAY` ➔ `DELIVERED`).

---

## Step 10: How to Update / Redeploy Code (Day-2 DevOps)

Whenever you push new changes to GitHub, update the server with this sequence:

```bash
cd /var/www/food-ordering-app

# 1. Pull the latest commits
git pull origin main

# 2. Update backend dependencies & DB if needed
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
cd ..

# 3. Rebuild React frontend
cd frontend
npm install
npm run build
cd ..

# 4. Zero-downtime reload backend via PM2
pm2 reload cravingbites-backend

# 5. Save PM2 state
pm2 save
```

*(You can also simply run the included automated script: `./scripts/redeploy.sh`)*

---

## 🛠️ PM2 Cheat Sheet & Troubleshooting

| Operation | Command |
|-----------|---------|
| View all processes | `pm2 list` or `pm2 status` |
| View live logs | `pm2 logs cravingbites-backend` |
| Clear old logs | `pm2 flush` |
| Restart process | `pm2 restart cravingbites-backend` |
| Reload (zero downtime) | `pm2 reload cravingbites-backend` |
| Stop process | `pm2 stop cravingbites-backend` |
| Delete process | `pm2 delete cravingbites-backend` |
| Live resource monitor | `pm2 monit` |
| Save current list for reboot | `pm2 save` |

### Common Issues & Quick Fixes:

* **Issue: "502 Bad Gateway"**
  * **Cause:** The Node.js backend is not running or crashed.
  * **Fix:** Run `pm2 status` to check if the app is online. Run `pm2 logs cravingbites-backend` to view the crash error.

* **Issue: Database connection error**
  * **Cause:** Wrong password or PostgreSQL service is stopped.
  * **Fix:** Check `sudo systemctl status postgresql` and verify `DATABASE_URL` in `backend/.env`.

* **Issue: React page gives 404 on refresh**
  * **Cause:** Nginx `try_files` directive is missing.
  * **Fix:** Ensure `try_files $uri $uri/ /index.html;` is present in your Nginx config.

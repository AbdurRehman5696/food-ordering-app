# 📖 Complete Student Guide: Full-Stack Deployment with PM2 & Nginx

This guide teaches how to deploy a full-stack **React + Node.js + PostgreSQL** application on a Linux VPS / Virtual Machine using **PM2** process manager and **Nginx**.

---

## 🎯 Architecture Overview (Non-Docker / Bare Metal)

```
+-------------------------------------------------------------------------------+
|                             Linux Server (Ubuntu)                             |
|                                                                               |
|  [Client Browser]                                                             |
|         │                                                                     |
|         ▼  Port 80 / 443                                                      |
|  ┌───────────────┐                                                            |
|  │ Nginx Server  │────► Serves React static build (/var/www/.../frontend/dist) |
|  └───────┬───────┘                                                            |
|          │ Reverse Proxy /api/ requests                                       |
|          ▼  Port 5000 (Internal)                                              |
|  ┌────────────────────────────────────────────────────────┐                   |
|  │ PM2 Process Manager                                    │                   |
|  │   └─► Node.js Backend Service (cravingbites-backend)   │                   |
|  └──────────────────────────┬─────────────────────────────┘                   |
|                             │ Database Connection (Port 5432)                 |
|                             ▼                                                 |
|  ┌────────────────────────────────────────────────────────┐                   |
|  │ PostgreSQL Database Server                             │                   |
|  └────────────────────────────────────────────────────────┘                   |
+-------------------------------------------------------------------------------+
```

---

## 📋 Step-by-Step Deployment Walkthrough

### Step 1: Install Prerequisites on Ubuntu Server

Log in to your Ubuntu VPS via SSH:
```bash
ssh username@YOUR_SERVER_IP
```

Update system packages and install Git, Node.js (v20 LTS), and build tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential

# Install Node.js 20 LTS from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v
npm -v
git --version
```

Install **PM2** globally:
```bash
sudo npm install -g pm2
pm2 -v
```

---

### Step 2: Install and Setup PostgreSQL Database

Install PostgreSQL:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```
For the EC2 security group, allow SSH only from your IP, and allow inbound HTTP (80)
and HTTPS (443) for visitors. Do not expose PostgreSQL (5432) or the Node API (5000)
to the public internet.

Create database and user:
```bash
sudo -u postgres psql
```
Inside the `psql` shell, execute:
```sql
CREATE USER fooduser WITH ENCRYPTED PASSWORD 'MyStrongPassword123!';
CREATE DATABASE food_order_db OWNER fooduser;
\q
```

---

### Step 3: Clone the Repository & Configure Environment

Clone the repository into your deployment directory (e.g., `/var/www/food-ordering-app` or your home directory):
```bash
git clone https://github.com/AbdurRehman5696/food-ordering-app.git
cd food-ordering-app
```

Configure the backend environment file named `backend/.env`:
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Update the `DATABASE_URL` with the credentials created in Step 2:
```ini
PORT=5000
DATABASE_URL="postgresql://fooduser:MyStrongPassword123!@localhost:5432/food_order_db?schema=public"
JWT_SECRET="PASTE_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS"
CLIENT_URL="http://YOUR_SERVER_IP"
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```
Generate a secret with `openssl rand -base64 48`. Keep this file on the server only; do not commit it.
`CLIENT_URL` is the browser-visible frontend origin (your EC2 public IP or domain, without a path).
PostgreSQL stays on `localhost` in `DATABASE_URL` when it runs on this EC2 instance.
Set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` to the administrator email and a unique
password of at least 12 characters. After setting them, run `node src/seed.js` from
`backend/` to provision the super admin. The legacy `ADMIN_EMAIL` and `ADMIN_PASSWORD`
names are also supported.
For local Vite development, `frontend/.env` may set `VITE_API_URL=http://localhost:5000`.
On EC2, the built frontend uses relative `/api` requests and Nginx proxies them to backend
`localhost:5000`; do not set a browser API URL to `localhost` in production.

---

### Step 4: Install Dependencies & Prepare Database

```bash
# 1. Backend Setup
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node src/seed.js     # Seeds initial demo food products & student account
cd ..

# 2. Frontend Setup & Build
cd frontend
npm install
npm run build        # Compiles React into the production 'dist/' folder
cd ..
```
The seed command provisions the super admin from `SUPER_ADMIN_EMAIL` and
`SUPER_ADMIN_PASSWORD` in `backend/.env`. Sign in at `http://YOUR_SERVER_IP/admin`.

---

### Step 5: Start & Manage the Backend with PM2

Instead of running `node server.js` (which dies when you close your SSH terminal), PM2 keeps your app running 24/7 and restarts it if it crashes.

#### Start the app using the ecosystem file:
```bash
pm2 start ecosystem.config.js
```
*(Or manually: `pm2 start backend/src/server.js --name cravingbites-backend`)*

#### Essential PM2 Commands for Students:
| Task | Command |
|------|---------|
| View status of all running apps | `pm2 status` or `pm2 list` |
| View live console logs | `pm2 logs cravingbites-backend` |
| Restart backend after edits | `pm2 restart cravingbites-backend` |
| Reload with zero-downtime | `pm2 reload cravingbites-backend` |
| Stop backend | `pm2 stop cravingbites-backend` |
| Monitor CPU & Memory in real-time | `pm2 monit` |

#### Enable Auto-Start on System Boot:
Ensure the application starts automatically if the server reboots:
```bash
pm2 startup systemd
# Run the command generated in your terminal (starting with sudo env PATH=...)
pm2 save
```

---

### Step 6: Configure Nginx to Serve Frontend & Reverse Proxy Backend

The EC2/PM2 Nginx config is stored in the repository as
`deploy/nginx/food-ordering-app.conf`. Install it using the exact site filename below:
```bash
sudo cp deploy/nginx/food-ordering-app.conf /etc/nginx/sites-available/food-ordering-app
```
The supplied config uses `server_name _;` so it works with an EC2 public IP. For a domain,
edit that directive to your domain name.

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/food-ordering-app /etc/nginx/sites-enabled/food-ordering-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Now open `http://YOUR_SERVER_IP` in any browser!

---

### Step 7: How to Redeploy When Code Changes (Zero-Downtime)

When students push changes to GitHub, updating the server takes just a few commands:

```bash
# Pull changes, re-install, re-build frontend, and reload PM2:
chmod +x ./scripts/redeploy.sh
./scripts/redeploy.sh
```

Or manually:
```bash
git pull origin main
cd frontend && npm run build && cd ..
pm2 reload cravingbites-backend
```

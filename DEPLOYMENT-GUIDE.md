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

Create database and user:
```bash
sudo -u postgres psql
```
Inside the `psql` shell, execute:
```sql
CREATE DATABASE food_order_db;
CREATE USER fooduser WITH ENCRYPTED PASSWORD 'MyStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE food_order_db TO fooduser;
\q
```

---

### Step 3: Clone the Repository & Configure Environment

Clone the repository into your deployment directory (e.g., `/var/www/food-ordering-app` or your home directory):
```bash
git clone https://github.com/AbdurRehman5696/food-ordering-app.git
cd food-ordering-app
```

Configure backend `.env`:
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Update the `DATABASE_URL` with the credentials created in Step 2:
```ini
PORT=5000
DATABASE_URL="postgresql://fooduser:MyStrongPassword123!@localhost:5432/food_order_db?schema=public"
JWT_SECRET="your_custom_jwt_secret_key"
CLIENT_URL="http://YOUR_SERVER_IP"
```

---

### Step 4: Install Dependencies & Prepare Database

```bash
# 1. Backend Setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node src/seed.js     # Seeds initial demo food products & student account
cd ..

# 2. Frontend Setup & Build
cd frontend
npm install
npm run build        # Compiles React into the production 'dist/' folder
cd ..
```

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

Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/food-ordering-app
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP_OR_DOMAIN;

    # 1. Serve compiled React frontend
    root /var/www/food-ordering-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Reverse proxy /api requests to PM2 Node.js backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/food-ordering-app /etc/nginx/sites-enabled/
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

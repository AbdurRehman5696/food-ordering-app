#!/usr/bin/env bash

set -euo pipefail

if [[ $EUID -eq 0 ]]; then
  echo "Run this script as your Ubuntu user (it will request sudo when needed)."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

read -r -p "Super admin email: " SUPER_ADMIN_EMAIL
read -r -s -p "Super admin password (at least 12 characters): " SUPER_ADMIN_PASSWORD
echo
read -r -s -p "Repeat super admin password: " SUPER_ADMIN_PASSWORD_CONFIRM
echo

if [[ -z "$SUPER_ADMIN_EMAIL" ]]; then
  echo "Super admin email is required."
  exit 1
fi

if [[ ${#SUPER_ADMIN_PASSWORD} -lt 12 ]]; then
  echo "Super admin password must be at least 12 characters."
  exit 1
fi

if [[ "$SUPER_ADMIN_PASSWORD" != "$SUPER_ADMIN_PASSWORD_CONFIRM" ]]; then
  echo "Super admin passwords do not match."
  exit 1
fi

escape_env_value() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

echo "Installing system packages..."
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential openssl postgresql postgresql-contrib

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(\".\")[0]')" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo npm install -g pm2
sudo systemctl start postgresql
sudo systemctl enable postgresql

DB_PASSWORD="$(openssl rand -hex 24)"
sudo -u postgres psql <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fooduser') THEN
    CREATE USER fooduser WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER USER fooduser WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE food_order_db OWNER fooduser'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'food_order_db')\gexec
ALTER DATABASE food_order_db OWNER TO fooduser;
SQL

PUBLIC_IP="$(curl -4 -fsS https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"
if [[ -z "$PUBLIC_IP" ]]; then
  echo "Could not detect the public IP or local address."
  exit 1
fi
JWT_SECRET="$(openssl rand -base64 48)"

ESCAPED_ADMIN_EMAIL="$(escape_env_value "$SUPER_ADMIN_EMAIL")"
ESCAPED_ADMIN_PASSWORD="$(escape_env_value "$SUPER_ADMIN_PASSWORD")"
ESCAPED_JWT_SECRET="$(escape_env_value "$JWT_SECRET")"

cat > backend/.env <<EOF
PORT=5000
DATABASE_URL="postgresql://fooduser:${DB_PASSWORD}@localhost:5432/food_order_db?schema=public"
JWT_SECRET="${ESCAPED_JWT_SECRET}"
CLIENT_URL="http://${PUBLIC_IP}"
SUPER_ADMIN_EMAIL="${ESCAPED_ADMIN_EMAIL}"
SUPER_ADMIN_PASSWORD="${ESCAPED_ADMIN_PASSWORD}"
EOF

chmod 600 backend/.env

echo "Installing dependencies and preparing the database..."
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node src/seed.js
cd ..

echo "Building the frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Starting the backend with PM2..."
if pm2 describe cravingbites-backend >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

STARTUP_OUTPUT="$(pm2 startup systemd --hp "$HOME" 2>&1 || true)"
echo "$STARTUP_OUTPUT"
STARTUP_COMMAND="$(printf '%s\n' "$STARTUP_OUTPUT" | grep '^sudo env PATH=' | tail -n1 || true)"
if [[ -n "$STARTUP_COMMAND" ]]; then
  eval "$STARTUP_COMMAND"
  pm2 save
fi

echo "Configuring Nginx..."
sudo cp deploy/nginx/food-ordering-app.conf /etc/nginx/sites-available/food-ordering-app
sudo ln -sfn /etc/nginx/sites-available/food-ordering-app /etc/nginx/sites-enabled/food-ordering-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Verifying the deployment..."
sleep 2
curl -fsS "http://127.0.0.1/api/health"

echo
echo "Deployment complete."
echo "Open: http://${PUBLIC_IP}"

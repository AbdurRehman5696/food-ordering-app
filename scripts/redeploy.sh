#!/usr/bin/env bash
# ==============================================================================
# Automated PM2 Redeployment Script for Students & Production
# Run this on your server whenever you push changes to GitHub!
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 [1/5] Pulling latest code from GitHub..."
git pull origin main

echo "📦 [2/5] Installing backend dependencies..."
cd backend
npm install --production=false
npx prisma generate
npx prisma migrate deploy
node src/seed.js
cd ..

echo "🎨 [3/5] Installing frontend & building production bundle..."
cd frontend
npm install
npm run build
cd ..

echo "🔄 [4/5] Reloading backend with PM2 zero-downtime..."
if pm2 describe cravingbites-backend >/dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi

echo "💾 [5/5] Saving PM2 state..."
pm2 save

echo "✅ Deployment successful! Your updated application is live."

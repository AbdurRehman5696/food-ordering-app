#!/usr/bin/env bash
# ==============================================================================
# Automated PM2 Redeployment Script for Students & Production
# Run this on your server whenever you push changes to GitHub!
# ==============================================================================

set -e

echo "🚀 [1/5] Pulling latest code from GitHub..."
git pull origin main

echo "📦 [2/5] Installing backend dependencies..."
cd backend
npm install --production=false
npx prisma generate
npx prisma migrate deploy || true
node src/seed.js || true
cd ..

echo "🎨 [3/5] Installing frontend & building production bundle..."
cd frontend
npm install
npm run build
cd ..

echo "🔄 [4/5] Reloading backend with PM2 zero-downtime..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "💾 [5/5] Saving PM2 state..."
pm2 save

echo "✅ Deployment successful! Your updated application is live."

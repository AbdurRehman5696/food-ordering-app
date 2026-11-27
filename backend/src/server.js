const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// DevOps / Student Healthcheck endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      database: 'CONNECTED',
      service: 'CravingBites Food Ordering API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check database query failed:', error);
    res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      service: 'CravingBites Food Ordering API'
    });
  }
});

let isShuttingDown = false;

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Failed to disconnect Prisma client:', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Root welcome endpoint
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
      <h1 style="color: #ea580c;">🍔 CravingBites API Server</h1>
      <p style="color: #475569;">Full-stack React + Node.js + PostgreSQL deployment demo for students.</p>
      <div style="margin-top: 20px; padding: 10px; background: #f8fafc; border-radius: 8px;">
        <code>GET /api/health</code> · <code>GET /api/products</code> · <code>POST /api/auth/login</code>
      </div>
    </div>
  `);
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  const status = error.status || 500;
  if (status >= 500) {
    console.error('Unhandled request error:', error);
  }
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : 'Invalid request'
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 CravingBites Backend is running on port ${PORT}`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

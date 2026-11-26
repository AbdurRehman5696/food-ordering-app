const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.warn('Prisma client initialization warning:', e.message);
}

// In-memory fallback if database container is not yet initialized during local testing
const memoryUsers = [];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Try DB first
    if (prisma) {
      try {
        const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existingUser) {
          return res.status(400).json({ error: 'An account with this email already exists' });
        }

        const newUser = await prisma.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'customer'
          }
        });

        const token = jwt.sign(
          { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          message: 'Registration successful!',
          token,
          user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
      } catch (dbErr) {
        console.warn('Database write failed, using fallback in-memory store:', dbErr.message);
      }
    }

    // Fallback store
    const existing = memoryUsers.find(u => u.email === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const memUser = {
      id: 'user_' + Date.now(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
      createdAt: new Date()
    };
    memoryUsers.push(memUser);

    const token = jwt.sign(
      { id: memUser.id, email: memUser.email, name: memUser.name, role: memUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful! (Demo fallback)',
      token,
      user: { id: memUser.id, name: memUser.name, email: memUser.email, role: memUser.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;

    if (prisma) {
      try {
        user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      } catch (dbErr) {
        console.warn('Database read failed, falling back to in-memory store:', dbErr.message);
      }
    }

    if (!user) {
      user = memoryUsers.find(u => u.email === email.toLowerCase());
    }

    // Seeded demo user support
    if (!user && email.toLowerCase() === 'student@example.com' && password === 'student123') {
      const demoHashed = await bcrypt.hash('student123', 10);
      user = {
        id: 'demo-student-id',
        name: 'Alex Student',
        email: 'student@example.com',
        password: demoHashed,
        role: 'customer'
      };
      memoryUsers.push(user);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

module.exports = router;

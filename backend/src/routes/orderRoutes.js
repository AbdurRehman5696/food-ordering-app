const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.warn('Prisma client warning in orders route:', e.message);
}

const memoryOrders = [];

// POST /api/orders (Protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, address, paymentMethod, totalAmount, deliveryFee = 2.99 } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!address) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    if (prisma) {
      try {
        const order = await prisma.order.create({
          data: {
            userId: req.user.id,
            totalAmount: parseFloat(totalAmount),
            deliveryFee: parseFloat(deliveryFee),
            address,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            status: 'PLACED',
            items: {
              create: items.map(item => ({
                productId: item.id || item.productId,
                quantity: item.quantity,
                price: parseFloat(item.price)
              }))
            }
          },
          include: {
            items: {
              include: { product: true }
            }
          }
        });

        return res.status(201).json({
          message: 'Order placed successfully!',
          order
        });
      } catch (dbErr) {
        console.warn('Prisma order creation failed, using memory store:', dbErr.message);
      }
    }

    // In-memory fallback
    const newOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      userId: req.user.id,
      userName: req.user.name,
      totalAmount: parseFloat(totalAmount),
      deliveryFee: parseFloat(deliveryFee),
      address,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      status: 'PLACED',
      createdAt: new Date().toISOString(),
      items: items.map(item => ({
        id: 'item_' + Math.random().toString(36).substr(2, 9),
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      }))
    };

    memoryOrders.unshift(newOrder);

    res.status(201).json({
      message: 'Order placed successfully! (Demo Mode)',
      order: newOrder
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// GET /api/orders (Protected - get user's orders)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (prisma) {
      try {
        const orders = await prisma.order.findMany({
          where: { userId: req.user.id },
          include: {
            items: {
              include: { product: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (orders) return res.json(orders);
      } catch (dbErr) {
        console.warn('Prisma orders query failed, using memory store:', dbErr.message);
      }
    }

    const userOrders = memoryOrders.filter(o => o.userId === req.user.id);
    res.json(userOrders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

module.exports = router;

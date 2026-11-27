const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const DELIVERY_FEE_CENTS = 299;
const MAX_QUANTITY = 99;

// POST /api/orders (Protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { items, address, paymentMethod = 'Cash on Delivery' } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    if (items.length > 50) {
      return res.status(400).json({ error: 'An order cannot contain more than 50 products' });
    }
    if (typeof address !== 'string' || !address.trim() || address.trim().length > 500) {
      return res.status(400).json({ error: 'Delivery address must be between 1 and 500 characters' });
    }
    const allowedPaymentMethods = ['Cash on Delivery', 'Card (Demo)'];
    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    const quantities = new Map();
    for (const item of items) {
      const productId = item && (item.id || item.productId);
      if (
        typeof productId !== 'string' ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QUANTITY
      ) {
        return res.status(400).json({ error: 'Each item must have a valid product ID and quantity (1-99)' });
      }
      quantities.set(productId, (quantities.get(productId) || 0) + item.quantity);
      if (quantities.get(productId) > MAX_QUANTITY) {
        return res.status(400).json({ error: 'A product quantity cannot exceed 99' });
      }
    }

    const products = await prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] } }
    });
    if (products.length !== quantities.size) {
      return res.status(400).json({ error: 'One or more products are no longer available' });
    }

    const productById = new Map(products.map(product => [product.id, product]));
    const orderItems = [...quantities.entries()].map(([productId, quantity]) => {
      const product = productById.get(productId);
      return {
        productId,
        quantity,
        price: Math.round(product.price * 100) / 100
      };
    });
    const subtotalCents = orderItems.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    );
    const deliveryFee = DELIVERY_FEE_CENTS / 100;
    const totalAmount = (subtotalCents + DELIVERY_FEE_CENTS) / 100;

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        totalAmount,
        deliveryFee,
        address: address.trim(),
        paymentMethod,
        status: 'PLACED',
        items: { create: orderItems }
      },
      include: { items: { include: { product: true } } }
    });
    res.status(201).json({
      message: 'Order placed successfully!',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// GET /api/orders (Protected - get user's orders)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

module.exports = router;

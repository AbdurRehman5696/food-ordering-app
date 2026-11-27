const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const PAGE_SIZE = 20;
const ORDER_STATUSES = ['PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const NEXT_STATUS = {
  PLACED: 'PREPARING',
  PREPARING: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED'
};

router.use(authenticateToken, requireAdmin);

router.get('/overview', async (req, res) => {
  try {
    const [totalOrders, totalCustomers, revenue, groupedStatuses] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    const ordersByStatus = Object.fromEntries(
      ORDER_STATUSES.map(status => [status, 0])
    );
    for (const group of groupedStatuses) {
      ordersByStatus[group.status] = group._count._all;
    }

    res.json({
      totalOrders,
      totalCustomers,
      totalRevenue: revenue._sum.totalAmount || 0,
      ordersByStatus
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load dashboard overview' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const status = req.query.status || 'ALL';
    if (!Number.isSafeInteger(page) || page < 1) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    if (status !== 'ALL' && !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status filter' });
    }

    const where = status === 'ALL' ? {} : { status };
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, image: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE
      }),
      prisma.order.count({ where })
    ]);

    res.json({ orders, total, page, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error('Admin order list error:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { status } = body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (NEXT_STATUS[order.status] !== status) {
      return res.status(409).json({
        error: `Order can only move to ${NEXT_STATUS[order.status] || 'no further status'}`
      });
    }

    const update = await prisma.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status }
    });
    if (update.count === 0) {
      return res.status(409).json({ error: 'Order status changed; refresh and try again' });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, image: true } }
          }
        }
      }
    });
    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Admin order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;

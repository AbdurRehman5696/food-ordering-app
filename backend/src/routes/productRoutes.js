const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {};

    if (typeof category === 'string' && category !== 'All') {
      where.category = category;
    }
    if (typeof search === 'string' && search.trim()) {
      const query = search.trim().slice(0, 100);
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

module.exports = router;

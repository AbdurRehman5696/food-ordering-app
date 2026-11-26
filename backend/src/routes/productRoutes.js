const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.warn('Prisma client warning in products route:', e.message);
}

// Sample catalog items
const defaultProducts = [
  {
    id: 'prod_1',
    name: 'Truffle Angus Burger',
    description: 'Double Angus beef patty, melted aged cheddar, caramelized onions, black truffle aioli on a brioche bun.',
    price: 13.99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    prepTime: '15-20 min',
    isFeatured: true
  },
  {
    id: 'prod_2',
    name: 'Crispy Nashville Hot Chicken',
    description: 'Buttermilk fried chicken breast, Nashville spice glaze, dill pickles, and creamy coleslaw.',
    price: 11.50,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    prepTime: '12-15 min',
    isFeatured: true
  },
  {
    id: 'prod_3',
    name: 'Artisan Woodfired Margherita',
    description: 'San Marzano tomato sauce, fresh buffalo mozzarella, aromatic basil leaves, extra virgin olive oil.',
    price: 14.99,
    category: 'Pizzas',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    prepTime: '18-22 min',
    isFeatured: true
  },
  {
    id: 'prod_4',
    name: 'Spicy Pepperoni & Hot Honey',
    description: 'Slow-cured pepperoni, fior di latte mozzarella, hot chili honey drizzle, fresh oregano.',
    price: 16.50,
    category: 'Pizzas',
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    rating: 4.95,
    prepTime: '18-22 min',
    isFeatured: true
  },
  {
    id: 'prod_5',
    name: 'Smoked Bacon Mac & Cheese Burger',
    description: 'Crispy smoked bacon strips, creamy four-cheese macaroni patty, BBQ drizzle, lettuce.',
    price: 12.99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    prepTime: '15-20 min',
    isFeatured: false
  },
  {
    id: 'prod_6',
    name: 'Mango Passionfruit Fizz',
    description: 'Fresh alphonso mango purée, sparkling mineral water, passionfruit seeds, fresh mint sprig.',
    price: 4.99,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    rating: 4.75,
    prepTime: '5 min',
    isFeatured: false
  },
  {
    id: 'prod_7',
    name: 'Cold Brew Nitro Coffee',
    description: 'Single-origin Ethiopian beans steeped for 24 hours, infused with nitrogen for a velvety head.',
    price: 5.25,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    rating: 4.85,
    prepTime: '3 min',
    isFeatured: false
  },
  {
    id: 'prod_8',
    name: 'Warm Belgian Chocolate Lava Cake',
    description: 'Decadent dark chocolate molten center, dusted with powdered sugar, served with Madagascar vanilla bean ice cream.',
    price: 7.99,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    rating: 4.95,
    prepTime: '10 min',
    isFeatured: true
  }
];

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    if (prisma) {
      try {
        const whereClause = {};
        if (category && category !== 'All') {
          whereClause.category = category;
        }
        if (search) {
          whereClause.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }

        const products = await prisma.product.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' }
        });

        if (products && products.length > 0) {
          return res.json(products);
        }
      } catch (dbErr) {
        console.warn('Prisma product query failed, using in-memory catalog:', dbErr.message);
      }
    }

    // Filter fallback
    let filtered = defaultProducts;
    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    res.json(filtered);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

module.exports = router;

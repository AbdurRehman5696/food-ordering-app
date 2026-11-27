require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const sampleProducts = [
  {
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

async function main() {
  const configuredSuperAdmin = Boolean(
    (process.env.SUPER_ADMIN_EMAIL || '').trim() ||
    (process.env.SUPER_ADMIN_PASSWORD || '')
  );
  const emailValue = configuredSuperAdmin
    ? process.env.SUPER_ADMIN_EMAIL
    : process.env.ADMIN_EMAIL;
  const superAdminPassword = configuredSuperAdmin
    ? process.env.SUPER_ADMIN_PASSWORD
    : process.env.ADMIN_PASSWORD;
  const superAdminEmail = emailValue && emailValue.trim().toLowerCase();

  if (Boolean(superAdminEmail) !== Boolean(superAdminPassword)) {
    throw new Error('Set both SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to provision the super admin');
  }
  if (superAdminPassword && superAdminPassword.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters');
  }

  console.log('🌱 Seeding database...');

  if (superAdminEmail) {
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 12);
    const superAdmin = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        name: 'CravingBites Super Admin',
        password: hashedSuperAdminPassword,
        role: 'admin'
      },
      create: {
        name: 'CravingBites Super Admin',
        email: superAdminEmail,
        password: hashedSuperAdminPassword,
        role: 'admin'
      }
    });
    console.log(`🛡️ Super admin provisioned: ${superAdmin.email}`);
  } else {
    console.warn('Super admin credentials are unset; no super admin account was provisioned.');
  }

  const hashedPassword = await bcrypt.hash('student123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: 'Alex Student',
      email: 'student@example.com',
      password: hashedPassword,
      role: 'customer'
    }
  });
  console.log(`👤 Seeded demo user: ${user.email} (password: student123)`);

  // Seed menu products
  for (const item of sampleProducts) {
    const existing = await prisma.product.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.product.create({ data: item });
    }
  }
  console.log(`🍕 Seeded ${sampleProducts.length} delicious menu products.`);
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

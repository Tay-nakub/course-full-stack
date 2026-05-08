import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

// Prisma 7 dropped the embedded query engine — must construct with an adapter.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@coffee.com' },
    update: {},
    create: { email: 'admin@coffee.com', password: adminHash, role: 'ADMIN' },
  });

  const staffHash = await bcrypt.hash('staff1234', 10);
  await prisma.user.upsert({
    where: { email: 'staff@coffee.com' },
    update: {},
    create: { email: 'staff@coffee.com', password: staffHash, role: 'STAFF' },
  });

  // ─── Categories ───────────────────────────────────────────────────────────
  // Category.name has no @unique, so use findFirst + create instead of upsert.
  const drinks =
    (await prisma.category.findFirst({ where: { name: 'เครื่องดื่ม' } })) ??
    (await prisma.category.create({
      data: { name: 'เครื่องดื่ม', sortOrder: 1 },
    }));

  const bakery =
    (await prisma.category.findFirst({ where: { name: 'เบเกอรี่' } })) ??
    (await prisma.category.create({
      data: { name: 'เบเกอรี่', sortOrder: 2 },
    }));

  // ─── Products ─────────────────────────────────────────────────────────────
  // Product.name has no @unique, so we identify by (name, categoryId).
  const upsertProduct = async (
    name: string,
    price: number,
    categoryId: string,
  ) => {
    const existing = await prisma.product.findFirst({
      where: { name, categoryId },
    });
    if (existing) {
      return prisma.product.update({
        where: { id: existing.id },
        data: { price, isActive: true },
      });
    }
    return prisma.product.create({
      data: { name, price, isActive: true, categoryId },
    });
  };

  const latte = await upsertProduct('Latte', 75, drinks.id);
  const americano = await upsertProduct('Americano', 60, drinks.id);
  const cappuccino = await upsertProduct('Cappuccino', 80, drinks.id);
  const croissant = await upsertProduct('Croissant', 65, bakery.id);

  // ─── Ingredients ──────────────────────────────────────────────────────────
  const coffee = await prisma.ingredient.upsert({
    where: { name: 'เมล็ดกาแฟ' },
    update: { costPerUnit: 0.8, minStock: 200 },
    create: {
      name: 'เมล็ดกาแฟ',
      unit: 'GRAM',
      costPerUnit: 0.8,
      minStock: 200,
    },
  });
  const milk = await prisma.ingredient.upsert({
    where: { name: 'นม' },
    update: { costPerUnit: 0.05, minStock: 1000 },
    create: {
      name: 'นม',
      unit: 'MILLILITER',
      costPerUnit: 0.05,
      minStock: 1000,
    },
  });
  const sugar = await prisma.ingredient.upsert({
    where: { name: 'น้ำตาล' },
    update: { costPerUnit: 0.02, minStock: 500 },
    create: {
      name: 'น้ำตาล',
      unit: 'GRAM',
      costPerUnit: 0.02,
      minStock: 500,
    },
  });
  const cup = await prisma.ingredient.upsert({
    where: { name: 'แก้ว' },
    update: { costPerUnit: 1.5, minStock: 50 },
    create: {
      name: 'แก้ว',
      unit: 'PIECE',
      costPerUnit: 1.5,
      minStock: 50,
    },
  });
  const flour = await prisma.ingredient.upsert({
    where: { name: 'แป้งครัวซองต์' },
    update: { costPerUnit: 0.1, minStock: 500 },
    create: {
      name: 'แป้งครัวซองต์',
      unit: 'GRAM',
      costPerUnit: 0.1,
      minStock: 500,
    },
  });

  // ─── Recipes (whole-replace) ──────────────────────────────────────────────
  const setRecipe = async (
    productId: string,
    items: Array<{ ingredientId: string; quantity: number }>,
  ) => {
    await prisma.recipeItem.deleteMany({ where: { productId } });
    if (items.length > 0) {
      await prisma.recipeItem.createMany({
        data: items.map((i) => ({ productId, ...i })),
      });
    }
  };

  await setRecipe(latte.id, [
    { ingredientId: coffee.id, quantity: 18 }, // 18g
    { ingredientId: milk.id, quantity: 200 }, // 200ml
    { ingredientId: cup.id, quantity: 1 }, // 1 cup
  ]);
  await setRecipe(americano.id, [
    { ingredientId: coffee.id, quantity: 18 },
    { ingredientId: cup.id, quantity: 1 },
  ]);
  await setRecipe(cappuccino.id, [
    { ingredientId: coffee.id, quantity: 18 },
    { ingredientId: milk.id, quantity: 150 },
    { ingredientId: cup.id, quantity: 1 },
  ]);
  await setRecipe(croissant.id, [{ ingredientId: flour.id, quantity: 80 }]);

  // ─── Initial stock (PURCHASE) ─────────────────────────────────────────────
  // Wipe prior seed PURCHASEs (note: Initial seed) so reruns are idempotent.
  await prisma.stockMovement.deleteMany({ where: { note: 'Initial seed' } });

  const initialStocks = [
    { ingredientId: coffee.id, quantity: 5000, costAtTime: 0.8 },
    { ingredientId: milk.id, quantity: 10000, costAtTime: 0.05 },
    { ingredientId: sugar.id, quantity: 3000, costAtTime: 0.02 },
    { ingredientId: cup.id, quantity: 500, costAtTime: 1.5 },
    { ingredientId: flour.id, quantity: 5000, costAtTime: 0.1 },
  ];

  for (const s of initialStocks) {
    await prisma.stockMovement.create({
      data: {
        ingredientId: s.ingredientId,
        quantity: s.quantity,
        reason: 'PURCHASE',
        costAtTime: s.costAtTime,
        note: 'Initial seed',
      },
    });
  }

  // Recompute currentStock from movements (canonical source of truth)
  for (const ing of [coffee, milk, sugar, cup, flour]) {
    const sum = await prisma.stockMovement.aggregate({
      where: { ingredientId: ing.id },
      _sum: { quantity: true },
    });
    await prisma.ingredient.update({
      where: { id: ing.id },
      data: { currentStock: Number(sum._sum.quantity ?? 0) },
    });
  }

  console.log('Seed complete');
  console.log('  admin@coffee.com / admin1234 (ADMIN)');
  console.log('  staff@coffee.com / staff1234 (STAFF)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { MenuCard } from '@/components/menu-card';
import type { Product, Category } from '@coffee/shared';
import { getServerToken } from '@/lib/auth';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL ?? 'http://localhost:4000';

async function fetchProducts(): Promise<Product[]> {
  const token = await getServerToken();
  const res = await fetch(`${NESTJS_URL}/api/menu/products?active=true`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store', // ตอนนี้ไม่ cache; Week 5 ค่อย optimize
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${NESTJS_URL}/api/menu/categories`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export default async function MenuPage() {
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);

  if (products.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">เมนู</h1>
        <p className="text-gray-500">ยังไม่มีเมนู — admin ยังไม่เพิ่ม</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">เมนู</h1>
      {categories.map((category) => {
        const items = products.filter((p) => p.categoryId === category.id);
        if (items.length === 0) return null;
        return (
          <section key={category.id} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">{category.name}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

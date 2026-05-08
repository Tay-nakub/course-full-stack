import { MenuCard } from '@/components/menu-card';
import { CATEGORY_LABELS, MOCK_MENU, type MenuCategory } from '@/lib/data/menu';

export default function MenuPage() {
  const categories: MenuCategory[] = ['drink', 'food', 'dessert'];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">เมนู</h1>
      {categories.map((category) => {
        const items = MOCK_MENU.filter((item) => item.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">
              {CATEGORY_LABELS[category]}
            </h2>
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

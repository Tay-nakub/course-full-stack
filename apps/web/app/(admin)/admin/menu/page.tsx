import { CategoryList } from './components/category-list';
import { ProductList } from './components/product-list';

export default function AdminMenuPage() {
  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold">จัดการเมนู</h1>
      <CategoryList />
      <ProductList />
    </div>
  );
}

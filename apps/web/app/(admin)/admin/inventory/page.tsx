import { IngredientList } from './components/ingredient-list';

export default function InventoryPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">วัตถุดิบ</h1>
      <IngredientList />
    </div>
  );
}

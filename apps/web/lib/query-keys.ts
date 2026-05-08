export const queryKeys = {
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  products: (filter?: { active?: boolean }) => ['products', filter] as const,
  product: (id: string) => ['products', id] as const,
};

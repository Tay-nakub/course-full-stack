'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  CreateProductSchema,
  type CreateProductInput,
  type Product,
  type Category,
} from '@coffee/shared';

// Zod 4 + .default() makes input/output diverge: input has `isActive?`
// (optional) while output (CreateProductInput) has `isActive: boolean`.
type ProductFormInput = z.input<typeof CreateProductSchema>;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export function ProductForm({ product, onSuccess }: { product?: Product; onSuccess: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!product;

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiFetch<Category[]>('/menu/categories'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl ?? undefined,
          isActive: product.isActive,
          categoryId: product.categoryId,
        }
      : { isActive: true },
  });

  const mutation = useMutation({
    mutationFn: (input: CreateProductInput) =>
      apiFetch(isEdit ? `/menu/products/${product!.id}` : '/menu/products', {
        method: isEdit ? 'PATCH' : 'POST',
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อสินค้า</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="price">ราคา (บาท)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="categoryId">หมวด</Label>
          <select
            id="categoryId"
            {...register('categoryId')}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">-- เลือกหมวด --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-destructive text-sm">{errors.categoryId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="imageUrl">URL รูป (optional)</Label>
        <Input id="imageUrl" type="url" {...register('imageUrl')} />
        {errors.imageUrl && <p className="text-destructive text-sm">{errors.imageUrl.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...register('isActive')} />
        <Label htmlFor="isActive">เปิดขาย</Label>
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {isEdit ? 'บันทึก' : 'เพิ่ม'}
      </Button>
    </form>
  );
}

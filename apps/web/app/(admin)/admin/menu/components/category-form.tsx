'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  CreateCategorySchema,
  type CreateCategoryInput,
  type Category,
} from '@coffee/shared';

// Zod 4 + .default() makes input/output diverge: input has `sortOrder?` (optional)
// while output (CreateCategoryInput) has `sortOrder: number`. RHF needs the
// input shape; the mutation API accepts the output shape (after Zod parses).
type CategoryFormInput = z.input<typeof CreateCategorySchema>;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export function CategoryForm({
  category,
  onSuccess,
}: {
  category?: Category;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput, unknown, CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: category
      ? { name: category.name, sortOrder: category.sortOrder }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      apiFetch(
        isEdit ? `/menu/categories/${category!.id}` : '/menu/categories',
        {
          method: isEdit ? 'PATCH' : 'POST',
          body: input,
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories });
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-4"
    >
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อหมวด</Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="sortOrder">ลำดับ</Label>
        <Input
          id="sortOrder"
          type="number"
          {...register('sortOrder', { valueAsNumber: true })}
        />
        {errors.sortOrder && (
          <p className="text-sm text-destructive">
            {errors.sortOrder.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {isEdit ? 'บันทึก' : 'เพิ่ม'}
      </Button>
    </form>
  );
}

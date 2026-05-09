'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  CreateIngredientSchema,
  INGREDIENT_UNITS,
  INGREDIENT_UNIT_LABELS,
  type CreateIngredientInput,
  type Ingredient,
} from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';

// Zod 4 + .default() — input has minStock?, output has minStock: number.
type IngredientFormInput = z.input<typeof CreateIngredientSchema>;

export function IngredientForm({
  ingredient,
  onSuccess,
}: {
  ingredient?: Ingredient;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!ingredient;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IngredientFormInput, unknown, CreateIngredientInput>({
    resolver: zodResolver(CreateIngredientSchema),
    defaultValues: ingredient
      ? {
          name: ingredient.name,
          unit: ingredient.unit,
          costPerUnit: Number(ingredient.costPerUnit),
          minStock: Number(ingredient.minStock),
        }
      : { unit: 'GRAM', costPerUnit: 0, minStock: 0 },
  });

  const mutation = useMutation({
    mutationFn: (input: CreateIngredientInput) =>
      apiFetch(isEdit ? `/inventory/ingredients/${ingredient!.id}` : '/inventory/ingredients', {
        method: isEdit ? 'PATCH' : 'POST',
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อ</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="unit">หน่วย</Label>
          <select
            id="unit"
            {...register('unit')}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
          >
            {INGREDIENT_UNITS.map((u) => (
              <option key={u} value={u}>
                {INGREDIENT_UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="costPerUnit">ต้นทุน/หน่วย (บาท)</Label>
          <Input
            id="costPerUnit"
            type="number"
            step="0.0001"
            {...register('costPerUnit', { valueAsNumber: true })}
          />
          {errors.costPerUnit && (
            <p className="text-destructive text-sm">{errors.costPerUnit.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="minStock">Stock ขั้นต่ำ (เพื่อแจ้งเตือน)</Label>
        <Input
          id="minStock"
          type="number"
          step="0.01"
          {...register('minStock', { valueAsNumber: true })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {isEdit ? 'บันทึก' : 'เพิ่ม'}
      </Button>
    </form>
  );
}

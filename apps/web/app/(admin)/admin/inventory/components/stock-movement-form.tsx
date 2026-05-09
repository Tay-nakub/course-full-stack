'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateStockMovementSchema,
  STOCK_MOVEMENT_REASONS,
  type CreateStockMovementInput,
  type Ingredient,
  INGREDIENT_UNIT_LABELS,
} from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';

// SALE is reserved for the order-COMPLETED transaction; admin UI exposes
// the manual-entry reasons only.
const ALLOWED_REASONS = STOCK_MOVEMENT_REASONS.filter((r) => r !== 'SALE');

export function StockMovementForm({
  ingredient,
  onSuccess,
}: {
  ingredient: Ingredient;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateStockMovementInput>({
    resolver: zodResolver(CreateStockMovementSchema),
    defaultValues: {
      ingredientId: ingredient.id,
      reason: 'PURCHASE' as const,
      quantity: 0,
    },
  });

  const reason = watch('reason');

  const mutation = useMutation({
    mutationFn: (input: CreateStockMovementInput) => {
      // Auto sign based on reason — user types positive numbers, form
      // applies the correct sign.
      const signedQuantity =
        input.reason === 'PURCHASE'
          ? Math.abs(input.quantity)
          : input.reason === 'WASTE'
            ? -Math.abs(input.quantity)
            : input.quantity; // ADJUSTMENT keeps user-entered sign
      return apiFetch('/inventory/ingredients/movements', {
        method: 'POST',
        body: { ...input, quantity: signedQuantity },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      onSuccess();
    },
    onError: (e: Error) => alert(`ผิดพลาด: ${e.message}`),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <input type="hidden" {...register('ingredientId')} />

      <div className="space-y-1">
        <Label htmlFor="reason">ประเภท</Label>
        <select
          id="reason"
          {...register('reason')}
          className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
        >
          {ALLOWED_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="quantity">
          จำนวน ({INGREDIENT_UNIT_LABELS[ingredient.unit]})
          {reason === 'WASTE' && <span className="text-red-500"> — จะลด stock</span>}
          {reason === 'PURCHASE' && <span className="text-green-700"> — จะเพิ่ม stock</span>}
          {reason === 'ADJUSTMENT' && (
            <span className="text-gray-500"> — ใส่ +/- ตามที่ต้องการ</span>
          )}
        </Label>
        <Input
          id="quantity"
          type="number"
          step="0.0001"
          {...register('quantity', { valueAsNumber: true })}
        />
        {errors.quantity && <p className="text-destructive text-sm">{errors.quantity.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="note">หมายเหตุ</Label>
        <Input id="note" {...register('note')} placeholder="เช่น ซื้อจากร้าน X" />
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        บันทึก
      </Button>
    </form>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type Product,
  type Ingredient,
  type RecipeItem,
  INGREDIENT_UNIT_LABELS,
} from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';

interface RecipeRow {
  ingredientId: string;
  quantity: number;
}

export function RecipeEditor({ product, onSuccess }: { product: Product; onSuccess: () => void }) {
  const qc = useQueryClient();

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => apiFetch<Ingredient[]>('/inventory/ingredients'),
  });

  const { data: existing = [], isLoading } = useQuery({
    queryKey: ['recipe', product.id],
    queryFn: () => apiFetch<RecipeItem[]>(`/inventory/recipes/product/${product.id}`),
  });

  const [rows, setRows] = useState<RecipeRow[]>([]);

  // Sync existing → state when load completes
  useEffect(() => {
    if (!isLoading) {
      setRows(
        existing.map((e) => ({
          ingredientId: e.ingredientId,
          quantity: Number(e.quantity),
        })),
      );
    }
  }, [isLoading, existing]);

  const saveMutation = useMutation({
    mutationFn: (items: RecipeRow[]) =>
      apiFetch(`/inventory/recipes/product/${product.id}`, {
        method: 'PUT',
        body: items,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipe', product.id] });
      onSuccess();
    },
    onError: (e: Error) => alert(`บันทึกไม่ได้: ${e.message}`),
  });

  if (isLoading) return <p>กำลังโหลด...</p>;

  const usedIds = new Set(rows.map((r) => r.ingredientId));
  const available = ingredients.filter((i) => !usedIds.has(i.id));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ระบุปริมาณวัตถุดิบที่ใช้ต่อ 1 หน่วยของ &ldquo;{product.name}&rdquo;
      </p>

      {rows.length === 0 && (
        <p className="py-4 text-center text-gray-400">ยังไม่มีวัตถุดิบในสูตร</p>
      )}

      {rows.map((row, idx) => {
        const ing = ingredients.find((i) => i.id === row.ingredientId);
        return (
          <div key={row.ingredientId} className="flex items-center gap-2">
            <span className="flex-1 font-medium">{ing?.name ?? '?'}</span>
            <Input
              type="number"
              step="0.0001"
              className="w-32"
              value={row.quantity}
              onChange={(e) => {
                const q = parseFloat(e.target.value);
                setRows(
                  rows.map((r, i) =>
                    i === idx ? { ...r, quantity: Number.isFinite(q) ? q : 0 } : r,
                  ),
                );
              }}
            />
            <span className="w-16 text-sm text-gray-500">
              {ing ? INGREDIENT_UNIT_LABELS[ing.unit] : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRows(rows.filter((_, i) => i !== idx))}
            >
              ลบ
            </Button>
          </div>
        );
      })}

      {available.length > 0 && (
        <div className="border-t pt-4">
          <Label htmlFor="add-ing" className="mb-2 block">
            เพิ่มวัตถุดิบ
          </Label>
          <select
            id="add-ing"
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              setRows([...rows, { ingredientId: e.target.value, quantity: 0 }]);
            }}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">-- เลือกวัตถุดิบ --</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({INGREDIENT_UNIT_LABELS[i.unit]})
              </option>
            ))}
          </select>
        </div>
      )}

      <Button
        onClick={() => saveMutation.mutate(rows)}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกสูตร'}
      </Button>
    </div>
  );
}

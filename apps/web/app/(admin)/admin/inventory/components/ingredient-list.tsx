'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api-client';
import { type Ingredient, INGREDIENT_UNIT_LABELS } from '@coffee/shared';
import { IngredientForm } from './ingredient-form';
import { StockMovementForm } from './stock-movement-form';

export function IngredientList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [creating, setCreating] = useState(false);
  const [recordingMovement, setRecordingMovement] =
    useState<Ingredient | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => apiFetch<Ingredient[]>('/inventory/ingredients'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/inventory/ingredients/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
    onError: (e: Error) => alert(`ลบไม่ได้: ${e.message}`),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          จำนวน {items.length} รายการ — Stock เปลี่ยนผ่าน Stock Movement
          (PURCHASE / SALE / WASTE / ADJUSTMENT)
        </p>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>+ เพิ่มวัตถุดิบ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มวัตถุดิบใหม่</DialogTitle>
            </DialogHeader>
            <IngredientForm onSuccess={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>หน่วย</TableHead>
              <TableHead>ต้นทุน/หน่วย</TableHead>
              <TableHead>Stock ปัจจุบัน</TableHead>
              <TableHead>ขั้นต่ำ</TableHead>
              <TableHead className="w-64" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => {
              const isLow = Number(i.currentStock) <= Number(i.minStock);
              return (
                <TableRow key={i.id} className={isLow ? 'bg-red-50' : ''}>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{INGREDIENT_UNIT_LABELS[i.unit]}</TableCell>
                  <TableCell>฿{Number(i.costPerUnit)}</TableCell>
                  <TableCell
                    className={isLow ? 'font-bold text-red-700' : ''}
                  >
                    {Number(i.currentStock)}
                  </TableCell>
                  <TableCell>{Number(i.minStock)}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecordingMovement(i)}
                    >
                      ปรับ Stock
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(i)}
                    >
                      แก้ไข
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        confirm(`ลบ "${i.name}"?`) &&
                        removeMutation.mutate(i.id)
                      }
                    >
                      ลบ
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขวัตถุดิบ</DialogTitle>
          </DialogHeader>
          {editing && (
            <IngredientForm
              ingredient={editing}
              onSuccess={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!recordingMovement}
        onOpenChange={() => setRecordingMovement(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ปรับ Stock: {recordingMovement?.name}
            </DialogTitle>
          </DialogHeader>
          {recordingMovement && (
            <StockMovementForm
              ingredient={recordingMovement}
              onSuccess={() => setRecordingMovement(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

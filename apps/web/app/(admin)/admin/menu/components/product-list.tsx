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
import { queryKeys } from '@/lib/query-keys';
import type { Product } from '@coffee/shared';
import { ProductForm } from './product-form';

export function ProductList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => apiFetch<Product[]>('/menu/products'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/menu/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products() }),
    onError: (error) => alert(`ลบไม่ได้: ${error.message}`),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">สินค้า</h2>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>+ เพิ่มสินค้า</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={() => setCreating(false)} />
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
              <TableHead>ราคา</TableHead>
              <TableHead>หมวด</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>฿{Number(p.price)}</TableCell>
                <TableCell>{p.category?.name ?? '—'}</TableCell>
                <TableCell>{p.isActive ? 'ขาย' : 'ปิด'}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(p)}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      confirm(`ลบ "${p.name}"?`) && removeMutation.mutate(p.id)
                    }
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขสินค้า</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProductForm
              product={editing}
              onSuccess={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

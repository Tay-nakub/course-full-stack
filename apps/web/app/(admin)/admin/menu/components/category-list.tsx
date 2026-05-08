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
import type { Category } from '@coffee/shared';
import { CategoryForm } from './category-form';

export function CategoryList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiFetch<Category[]>('/menu/categories'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/menu/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories }),
    onError: (error) => alert(`ลบไม่ได้: ${error.message}`),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">หมวดหมู่</h2>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>+ เพิ่มหมวด</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มหมวดใหม่</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-gray-500">กำลังโหลด...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ลำดับ</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.sortOrder}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(c)}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      confirm(`ลบ "${c.name}"?`) && removeMutation.mutate(c.id)
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
            <DialogTitle>แก้ไขหมวด</DialogTitle>
          </DialogHeader>
          {editing && (
            <CategoryForm
              category={editing}
              onSuccess={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

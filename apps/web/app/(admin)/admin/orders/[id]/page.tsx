'use client';

import Link from 'next/link';
import { use } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@coffee/shared';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING: { next: 'PREPARING', label: 'รับออเดอร์' },
  PREPARING: { next: 'READY', label: 'ทำเสร็จ' },
  READY: { next: 'COMPLETED', label: 'ลูกค้ารับแล้ว' },
};

const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('th-TH') : '—';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => apiFetch<Order>(`/orders/${id}`),
    refetchInterval: 10_000,
  });

  const updateStatus = useMutation({
    mutationFn: (next: OrderStatus) =>
      apiFetch(`/orders/${id}/status`, {
        method: 'PATCH',
        body: { status: next },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'เกิดข้อผิดพลาด';
      alert(msg);
    },
  });

  if (isLoading) return <p>กำลังโหลด...</p>;
  if (error || !order) {
    return (
      <div>
        <Link href="/admin/orders" className="text-sm text-amber-700 hover:underline">
          ← กลับหน้าออเดอร์
        </Link>
        <p className="mt-4 text-red-600">ไม่พบออเดอร์</p>
      </div>
    );
  }

  const transition = NEXT_STATUS[order.status];
  const canCancel = order.status === 'PENDING' || order.status === 'PREPARING';

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm text-amber-700 hover:underline">
          ← กลับหน้าออเดอร์
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-3xl font-bold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">สร้างเมื่อ {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">ลูกค้า</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">ชื่อ</dt>
              <dd className="font-medium">{order.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">เบอร์โทร</dt>
              <dd className="font-mono">{order.customerPhone}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">เวลา</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">ชำระเงิน</dt>
              <dd>{formatDateTime(order.paidAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">เสร็จสิ้น</dt>
              <dd>{formatDateTime(order.completedAt)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">รายการ</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สินค้า</TableHead>
              <TableHead className="text-right">ราคา/ชิ้น</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead className="text-right">รวม</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.productName}</TableCell>
                <TableCell className="text-right">฿{Number(item.unitPrice)}</TableCell>
                <TableCell className="text-right">{item.qty}</TableCell>
                <TableCell className="text-right font-medium">฿{Number(item.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <dl className="mt-4 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between text-gray-500">
            <dt>ยอดรวม</dt>
            <dd>฿{Number(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>รวมทั้งสิ้น</dt>
            <dd>฿{Number(order.total)}</dd>
          </div>
        </dl>
      </section>

      {(transition || canCancel) && (
        <section className="flex flex-wrap gap-2 rounded border bg-white p-4">
          {transition && (
            <Button
              onClick={() => updateStatus.mutate(transition.next)}
              disabled={updateStatus.isPending}
            >
              {transition.label}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('ยกเลิกออเดอร์?')) updateStatus.mutate('CANCELLED');
              }}
              disabled={updateStatus.isPending}
            >
              ยกเลิกออเดอร์
            </Button>
          )}
        </section>
      )}
    </div>
  );
}

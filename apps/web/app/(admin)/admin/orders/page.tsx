'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@coffee/shared';

type Filter = OrderStatus | 'ALL';

const FILTERS: Filter[] = ['ALL', ...ORDER_STATUSES];

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', { status: filter }],
    queryFn: () => apiFetch<Order[]>(filter === 'ALL' ? '/orders' : `/orders?status=${filter}`),
    refetchInterval: 10_000,
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">ออเดอร์ทั้งหมด</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded px-3 py-1 text-sm ${
              filter === s ? 'bg-amber-700 text-white' : 'bg-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>กำลังโหลด...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">ไม่มีออเดอร์ในช่วงนี้</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขออเดอร์</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>รายการ</TableHead>
              <TableHead>รวม</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>เวลา</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono">
                  <Link href={`/admin/orders/${o.id}`} className="text-amber-700 hover:underline">
                    {o.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{o.customerName}</TableCell>
                <TableCell>{o.items.reduce((s, i) => s + i.qty, 0)} ชิ้น</TableCell>
                <TableCell>฿{Number(o.total)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleString('th-TH')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

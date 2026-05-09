'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/order-status-badge';
import type { Order } from '@coffee/shared';

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiFetch<Order>(`/orders/${id}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'CANCELLED') return false;
      return 5000; // poll every 5 sec until terminal
    },
  });

  if (isLoading) return <p className="py-12 text-center">กำลังโหลด...</p>;
  if (error || !order) return <p className="py-12 text-center text-red-600">ไม่พบออเดอร์</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">ออเดอร์ {order.orderNumber}</h1>
        <p className="mb-4 text-gray-500">
          {order.customerName} · {order.customerPhone}
        </p>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-4 rounded border p-4">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between py-1">
            <span>
              {i.productName} × {i.qty}
            </span>
            <span>฿{Number(i.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
          <span>รวม</span>
          <span>฿{Number(order.total)}</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">🔄 หน้านี้รีเฟรชอัตโนมัติทุก 5 วินาที</p>
    </div>
  );
}

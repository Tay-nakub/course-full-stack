'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@coffee/shared';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status-badge';

const NEXT_STATUS: Partial<
  Record<OrderStatus, { next: OrderStatus; label: string }>
> = {
  PENDING: { next: 'PREPARING', label: 'รับออเดอร์' },
  PREPARING: { next: 'READY', label: 'ทำเสร็จ' },
  READY: { next: 'COMPLETED', label: 'ลูกค้ารับแล้ว' },
};

export function OrderCard({ order }: { order: Order }) {
  const qc = useQueryClient();

  const advance = useMutation({
    mutationFn: (next: OrderStatus) =>
      apiFetch(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: next },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  const cancel = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: 'CANCELLED' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  const transition = NEXT_STATUS[order.status];

  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-lg font-bold">{order.orderNumber}</div>
          <div className="text-sm text-gray-500">
            {order.customerName} · {order.customerPhone}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-3 space-y-1 border-t pt-3">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm">
            <span>
              {i.productName} × {i.qty}
            </span>
            <span className="text-gray-500">฿{Number(i.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="font-bold">฿{Number(order.total)}</span>

        <div className="flex gap-2">
          {transition && (
            <Button
              size="sm"
              onClick={() => advance.mutate(transition.next)}
              disabled={advance.isPending}
            >
              {transition.label}
            </Button>
          )}
          {(order.status === 'PENDING' || order.status === 'PREPARING') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('ยกเลิกออเดอร์?')) cancel.mutate();
              }}
              disabled={cancel.isPending}
            >
              ยกเลิก
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

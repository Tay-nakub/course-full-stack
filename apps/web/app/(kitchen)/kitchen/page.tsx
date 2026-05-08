'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Order } from '@coffee/shared';
import { OrderCard } from './components/order-card';

export default function KitchenPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', { activeOnly: true }],
    queryFn: () => apiFetch<Order[]>('/orders?activeOnly=true'),
    refetchInterval: 5000, // poll every 5 sec
  });

  if (isLoading) return <p>กำลังโหลด...</p>;

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        🎉 ยังไม่มีออเดอร์ค้าง
      </div>
    );
  }

  // Group by status for visual order
  const byStatus = {
    PENDING: orders.filter((o) => o.status === 'PENDING'),
    PREPARING: orders.filter((o) => o.status === 'PREPARING'),
    READY: orders.filter((o) => o.status === 'READY'),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        ออเดอร์ที่ค้าง ({orders.length})
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Column title="🕐 รอชำระ" orders={byStatus.PENDING} />
        <Column title="🔥 กำลังเตรียม" orders={byStatus.PREPARING} />
        <Column title="✅ พร้อมรับ" orders={byStatus.READY} />
      </div>
    </div>
  );
}

function Column({ title, orders }: { title: string; orders: Order[] }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">
        {title} ({orders.length})
      </h2>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">ว่าง</p>
        ) : (
          orders.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}

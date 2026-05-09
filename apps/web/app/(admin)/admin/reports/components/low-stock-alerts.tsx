'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { LowStockItem } from '@coffee/shared';

export function LowStockAlerts() {
  const { data = [] } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: () => apiFetch<LowStockItem[]>('/reports/low-stock'),
    refetchInterval: 60_000,
  });

  if (data.length === 0) {
    return (
      <div className="rounded border border-green-200 bg-green-50 p-4 text-green-800">
        Stock ทุกตัวอยู่ในเกณฑ์
      </div>
    );
  }

  return (
    <div className="rounded border border-red-200 bg-red-50 p-4">
      <h3 className="mb-2 font-bold text-red-800">Stock ใกล้หมด</h3>
      <ul className="space-y-1 text-sm">
        {data.map((i) => (
          <li key={i.ingredientId}>
            <span className="font-medium">{i.name}</span>: เหลือ {i.currentStock} {i.unit} (ขั้นต่ำ{' '}
            {i.minStock}) — <span className="text-red-700">ขาด {i.shortfall.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

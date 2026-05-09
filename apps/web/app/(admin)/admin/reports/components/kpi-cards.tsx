'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { DailyReport } from '@coffee/shared';

export function KpiCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: () => apiFetch<DailyReport>('/reports/daily'),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) return <p>กำลังโหลด...</p>;

  const cards = [
    {
      label: 'รายได้วันนี้',
      value: `฿${data.revenue.toFixed(2)}`,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'ต้นทุนวันนี้',
      value: `฿${data.cogs.toFixed(2)}`,
      color: 'text-orange-700 bg-orange-50',
    },
    {
      label: 'กำไรขั้นต้น',
      value: `฿${data.grossProfit.toFixed(2)}`,
      color: 'text-green-700 bg-green-50',
    },
    {
      label: 'อัตรากำไร',
      value: `${data.grossMarginPct.toFixed(1)}%`,
      color:
        data.grossMarginPct >= 50 ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50',
    },
    {
      label: 'จำนวนออเดอร์',
      value: data.orderCount.toString(),
      color: 'text-gray-700 bg-gray-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className={`rounded p-4 ${c.color}`}>
          <div className="text-xs uppercase opacity-70">{c.label}</div>
          <div className="mt-1 text-2xl font-bold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

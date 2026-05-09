'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiFetch } from '@/lib/api-client';
import type { RevenueDayRow } from '@coffee/shared';

export function RevenueChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['reports', 'revenue-last-7'],
    queryFn: () => apiFetch<RevenueDayRow[]>('/reports/revenue-last-days?days=7'),
    refetchInterval: 60_000,
  });

  if (isLoading) return <p>กำลังโหลด...</p>;
  if (data.length === 0) {
    return <p className="py-12 text-center text-gray-500">ยังไม่มีข้อมูลรายได้</p>;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">รายได้ 7 วันที่ผ่านมา</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="รายได้" />
          <Line type="monotone" dataKey="cogs" stroke="#ea580c" name="ต้นทุน" />
          <Line type="monotone" dataKey="grossProfit" stroke="#16a34a" name="กำไร" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

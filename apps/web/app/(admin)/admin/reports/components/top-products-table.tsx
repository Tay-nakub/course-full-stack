'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TopProduct } from '@coffee/shared';

export function TopProductsTable() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['reports', 'top-products', 7],
    queryFn: () => apiFetch<TopProduct[]>('/reports/top-products?days=7&limit=5'),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">เมนูขายดี (7 วัน)</h2>
      {isLoading ? (
        <p>กำลังโหลด...</p>
      ) : data.length === 0 ? (
        <p className="py-12 text-center text-gray-500">ไม่มีข้อมูล</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalQty" fill="#2563eb" name="จำนวนขาย" />
            </BarChart>
          </ResponsiveContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>อันดับ</TableHead>
                <TableHead>เมนู</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>ยอดขาย</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p, i) => (
                <TableRow key={p.productId}>
                  <TableCell>#{i + 1}</TableCell>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell>{p.totalQty} ชิ้น</TableCell>
                  <TableCell>฿{p.totalRevenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

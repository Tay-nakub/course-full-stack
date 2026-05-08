import type { OrderStatus } from '@coffee/shared';

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'รอชำระ',
  PREPARING: 'กำลังเตรียม',
  READY: 'พร้อมรับ',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

const COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  READY: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${COLORS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import type { Order } from '@coffee/shared';
import { useCart } from '@/stores/cart-store';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Customer-facing checkout schema (subset of CreateOrderSchema)
const CheckoutSchema = z.object({
  customerName: z.string().min(1, 'กรุณากรอกชื่อ'),
  customerPhone: z.string().min(9, 'เบอร์โทรไม่ครบ'),
});
type CheckoutInput = z.infer<typeof CheckoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
  });

  const placeOrder = useMutation({
    mutationFn: (input: CheckoutInput) =>
      apiFetch<Order>('/orders', {
        method: 'POST',
        body: {
          ...input,
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        },
      }),
    onSuccess: (order) => {
      clear();
      router.push(`/order/${order.id}`);
    },
  });

  if (!mounted) {
    return <p className="py-12 text-center text-gray-500">กำลังโหลด...</p>;
  }

  if (items.length === 0) {
    return <p className="py-12 text-center">ตะกร้าว่างเปล่า</p>;
  }

  const errorDetails =
    placeOrder.error instanceof ApiError
      ? ((placeOrder.error.details as { message?: string } | null)?.message ??
        'สั่งซื้อไม่สำเร็จ')
      : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Customer info form */}
      <div>
        <h1 className="mb-6 text-2xl font-bold">ชำระเงิน</h1>
        <form
          onSubmit={handleSubmit((d) => placeOrder.mutate(d))}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label htmlFor="customerName">ชื่อ</Label>
            <Input id="customerName" {...register('customerName')} />
            {errors.customerName && (
              <p className="text-destructive text-sm">
                {errors.customerName.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerPhone">เบอร์โทร</Label>
            <Input id="customerPhone" {...register('customerPhone')} />
            {errors.customerPhone && (
              <p className="text-destructive text-sm">
                {errors.customerPhone.message}
              </p>
            )}
          </div>

          {errorDetails && (
            <p className="border-destructive/50 bg-destructive/10 text-destructive rounded border p-2 text-sm">
              {errorDetails}
            </p>
          )}

          <Button
            type="submit"
            disabled={placeOrder.isPending}
            className="w-full"
          >
            {placeOrder.isPending ? 'กำลังสั่ง...' : `ยืนยันสั่ง ฿${subtotal}`}
          </Button>
        </form>
      </div>

      {/* Order summary */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">สรุปออเดอร์</h2>
        <div className="rounded border p-4">
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between py-1">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>฿{i.qty * i.unitPrice}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
            <span>รวม</span>
            <span>฿{subtotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

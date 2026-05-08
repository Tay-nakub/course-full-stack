'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { CartLineItem } from '@/components/cart-line-item';

export default function CartPage() {
  // Avoid hydration mismatch — wait for persist rehydrate.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);

  if (!mounted) {
    return <p className="py-12 text-center text-gray-500">กำลังโหลด...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">ตะกร้าว่างเปล่า</h1>
        <Button asChild>
          <Link href="/menu">เลือกเมนู</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">ตะกร้า</h1>
      <div className="rounded border">
        {items.map((item) => (
          <CartLineItem key={item.productId} item={item} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={clear}>
          ล้างตะกร้า
        </Button>
        <div className="text-right">
          <div className="text-sm text-gray-500">รวม</div>
          <div className="text-2xl font-bold">฿{subtotal}</div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/menu">เพิ่มสินค้า</Link>
        </Button>
        <Button asChild>
          <Link href="/checkout">ไปชำระเงิน</Link>
        </Button>
      </div>
    </div>
  );
}

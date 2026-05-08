'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/stores/cart-store';
import type { Product } from '@coffee/shared';

export function MenuCard({ item }: { item: Product }) {
  const add = useCart((s) => s.add);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="aspect-square w-full rounded object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded bg-gray-100 text-4xl">
            ☕
          </div>
        )}
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-lg font-semibold">฿{Number(item.price)}</span>
        <Button
          size="sm"
          onClick={() =>
            add({
              productId: item.id,
              name: item.name,
              unitPrice: Number(item.price),
              imageUrl: item.imageUrl,
            })
          }
        >
          เพิ่มลงตะกร้า
        </Button>
      </CardContent>
    </Card>
  );
}

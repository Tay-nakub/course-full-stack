'use client';

import { useCart, type CartItem } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';

export function CartLineItem({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  return (
    <div className="flex items-center gap-4 border-b py-4">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-16 w-16 rounded object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100 text-2xl">
          ☕
        </div>
      )}

      <div className="flex-1">
        <div className="font-semibold">{item.name}</div>
        <div className="text-sm text-gray-500">฿{item.unitPrice} / ชิ้น</div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQty(item.productId, item.qty - 1)}
        >
          −
        </Button>
        <span className="w-8 text-center font-medium">{item.qty}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQty(item.productId, item.qty + 1)}
        >
          +
        </Button>
      </div>

      <div className="w-20 text-right font-semibold">
        ฿{item.qty * item.unitPrice}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => remove(item.productId)}
        aria-label={`ลบ ${item.name}`}
      >
        ✕
      </Button>
    </div>
  );
}

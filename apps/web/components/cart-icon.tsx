'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';

export function CartIcon() {
  // Avoid hydration mismatch — read store state only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const totalQty = useCart((s) => s.totalQty());
  const display = mounted ? totalQty : 0;

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/cart" aria-label={`Cart with ${display} items`}>
        🛒 Cart ({display})
      </Link>
    </Button>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CartIcon() {
  const [count, setCount] = useState(0);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCount((c) => c + 1)}
      aria-label={`Cart with ${count} items`}
    >
      🛒 Cart ({count})
    </Button>
  );
}

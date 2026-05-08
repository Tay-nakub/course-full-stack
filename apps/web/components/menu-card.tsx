import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Product } from '@coffee/shared';

export function MenuCard({ item }: { item: Product }) {
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
      <CardContent>
        <div className="text-lg font-semibold">฿{Number(item.price)}</div>
      </CardContent>
    </Card>
  );
}

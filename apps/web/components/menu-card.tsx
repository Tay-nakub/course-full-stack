import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MenuItem } from '@/lib/data/menu';

export function MenuCard({ item }: { item: MenuItem }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="text-4xl">{item.imageEmoji}</div>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">฿{item.price}</div>
      </CardContent>
    </Card>
  );
}

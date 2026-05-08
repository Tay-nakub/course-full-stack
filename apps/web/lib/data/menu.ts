export type MenuCategory = 'drink' | 'food' | 'dessert';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageEmoji: string;
}

export const MOCK_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Espresso',
    description: 'กาแฟเอสเปรสโซ่ shot คู่ เข้มข้น',
    price: 60,
    category: 'drink',
    imageEmoji: '☕',
  },
  {
    id: 'm2',
    name: 'Latte',
    description: 'นมสตรีมหอม ผสม espresso shot',
    price: 75,
    category: 'drink',
    imageEmoji: '🥛',
  },
  {
    id: 'm3',
    name: 'Cappuccino',
    description: 'เนื้อโฟมหนา รสเข้ม',
    price: 75,
    category: 'drink',
    imageEmoji: '☕',
  },
  {
    id: 'm4',
    name: 'Americano',
    description: 'Espresso + น้ำร้อน',
    price: 55,
    category: 'drink',
    imageEmoji: '☕',
  },
  {
    id: 'm5',
    name: 'Croissant',
    description: 'ครัวซองต์เนยอบสด',
    price: 65,
    category: 'food',
    imageEmoji: '🥐',
  },
  {
    id: 'm6',
    name: 'Brownie',
    description: 'บราวนี่ช็อกโกแลตเข้ม',
    price: 70,
    category: 'dessert',
    imageEmoji: '🍫',
  },
];

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  drink: 'เครื่องดื่ม',
  food: 'อาหาร',
  dessert: 'ของหวาน',
};

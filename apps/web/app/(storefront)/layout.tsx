import Link from 'next/link';
import { CartIcon } from '@/components/cart-icon';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/menu" className="text-xl font-semibold">
            ☕ Coffee Shop
          </Link>
          <CartIcon />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-gray-50 py-4 text-center text-sm text-gray-500">
        © 2026 Coffee Shop · Learning Project
      </footer>
    </div>
  );
}

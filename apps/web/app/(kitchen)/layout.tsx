import Link from 'next/link';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/kitchen" className="text-xl font-bold">
            🍳 Kitchen Display
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm underline">ออกจากระบบ</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

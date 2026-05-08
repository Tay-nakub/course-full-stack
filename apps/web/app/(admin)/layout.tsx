import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-lg font-semibold">☕ Coffee Admin</h2>
        <nav className="space-y-1">
          <Link
            href="/admin/menu"
            className="block rounded px-3 py-2 hover:bg-gray-200"
          >
            จัดการเมนู
          </Link>
          <Link
            href="/admin/orders"
            className="block rounded px-3 py-2 hover:bg-gray-200"
          >
            ออเดอร์{' '}
            <span className="text-xs text-gray-500">(Week 4)</span>
          </Link>
          <Link
            href="/admin/reports"
            className="block rounded px-3 py-2 hover:bg-gray-200"
          >
            รายงาน{' '}
            <span className="text-xs text-gray-500">(Week 5)</span>
          </Link>
          <form action="/api/auth/logout" method="POST" className="pt-4">
            <button className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50">
              ออกจากระบบ
            </button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

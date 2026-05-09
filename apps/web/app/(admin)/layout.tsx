import Link from 'next/link';
import type { Role } from '@coffee/shared';
import { getCurrentUser } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/menu', label: 'จัดการเมนู', roles: ['ADMIN'] },
  { href: '/admin/orders', label: 'ออเดอร์', roles: ['ADMIN', 'STAFF'] },
  { href: '/admin/inventory', label: 'วัตถุดิบ', roles: ['ADMIN'] },
  { href: '/admin/reports', label: 'รายงาน', roles: ['ADMIN'] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const visibleNav = user ? NAV_ITEMS.filter((item) => item.roles.includes(user.role)) : [];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-lg font-semibold">☕ Coffee Admin</h2>

        {user && (
          <div className="mb-4 rounded border bg-white p-3 text-sm">
            <div className="truncate font-medium" title={user.email}>
              {user.email}
            </div>
            <div className="mt-1">
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                  user.role === 'ADMIN'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 hover:bg-gray-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/api/auth/logout" method="POST" className="pt-4">
          <button className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50">
            ออกจากระบบ
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

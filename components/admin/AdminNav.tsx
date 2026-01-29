'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Team Management',
    href: '/admin/team',
    icon: Users,
  },
  {
    title: 'Activities Management',
    href: '/admin/activities',
    icon: Activity,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 border-r bg-muted/30 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold px-3">Admin Panel</h2>
      </div>

      <ul className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

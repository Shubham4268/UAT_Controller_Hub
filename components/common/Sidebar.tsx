'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/app/actions/auth.actions';

type NavItem = {
  label: string;
  href: string;
};

const mainNavigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Team',
    href: '/team',
  },
  {
    label: 'Activities',
    href: '/activities',
  },
];

const leadNavigationItems: NavItem[] = [
  {
    label: 'Lead Dashboard',
    href: '/lead/dashboard',
  },
  
  {
    label: 'Manage Activities',
    href: '/lead/activities',
  },{
    label: 'Activities',
    href: '/lead/my-activities',
  },
  {
    label: 'My Profile',
    href: '/profile',
  },
];

const testerNavigationItems: NavItem[] = [
  {
    label: 'My Activities',
    href: '/tester/activities',
  },
  {
    label: 'My Profile',
    href: '/profile',
  },
];

const adminNavigationItems: NavItem[] = [
  {
    label: 'Admin',
    href: '/admin',
  },
];

type SidebarProps = {
  userRole?: string;
};

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const isAdmin = userRole === 'admin';
  const isLead = userRole === 'lead';
  const isTester = userRole === 'tester';

  async function handleLogout() {
    await logout();
  }

  // Determine which items to show
  let navItems: NavItem[] = [];
  if (isAdmin) {
    navItems = [...mainNavigationItems, ...adminNavigationItems, ...leadNavigationItems, ...testerNavigationItems];
  } else if (isLead) {
    navItems = leadNavigationItems;
  } else if (isTester) {
    navItems = testerNavigationItems;
  } else {
    navItems = mainNavigationItems;
  }

  return (
    <aside className="w-60 border-r bg-card h-screen flex flex-col">
      {/* App branding */}
      <div className="p-[18px] border-b">
        <Link href="/dashboard">
          <h1 className="text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity">UAT Controller Hub</h1>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-foreground/70 hover:bg-accent/50 hover:text-accent-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer with logout button */}
      <div className="p-4 border-t">
        <form action={handleLogout}>
          <button
            type="submit"
            className="w-full px-3 py-2 rounded-md text-sm font-semibold border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}

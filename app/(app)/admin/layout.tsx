import { requireAdminPage } from '@/lib/auth/authorization';
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Enforce admin-only access for all /admin routes
  await requireAdminPage();

  return (
    <div className="flex h-full">
      <AdminNav />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}

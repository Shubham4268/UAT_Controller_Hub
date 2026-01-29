import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { getAuthUser } from '@/lib/auth/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fetch authenticated user session
  const user = await getAuthUser();
  const userRole = user?.role || 'member';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={userRole} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}

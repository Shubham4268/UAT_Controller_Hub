import { requireAdminPage } from '@/lib/auth/authorization';
import { getTeamMembers } from '@/lib/data/team';
import { notFound } from 'next/navigation';
import EditTeamMemberForm from './EditTeamMemberForm';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTeamMemberPage({ params }: PageProps) {
  // Enforce admin-only access
  await requireAdminPage();

  const { id } = await params;

  // Fetch all team members and find the one being edited
  const teamMembers = await getTeamMembers();
  const member = teamMembers.find((m) => m.id === id);

  if (!member) {
    notFound();
  }

  return <EditTeamMemberForm member={member} />;
}

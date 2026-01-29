import { requireAdminPage } from '@/lib/auth/authorization';
import { getTeamMembers } from '@/lib/data/team';
import AddActivityForm from './AddActivityForm';

export default async function AddActivityPage() {
  // Enforce admin-only access
  await requireAdminPage();

  // Fetch team members for member selection
  const teamMembers = await getTeamMembers();

  return <AddActivityForm teamMembers={teamMembers} />;
}

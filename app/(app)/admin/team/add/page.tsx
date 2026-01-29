import { requireAdminPage } from '@/lib/auth/authorization';
import AddTeamMemberForm from './AddTeamMemberForm';

export default async function AddTeamMemberPage() {
  // Enforce admin-only access
  await requireAdminPage();

  return <AddTeamMemberForm />;
}

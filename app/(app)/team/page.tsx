// ISG Configuration: Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

import { getTeamMembers } from '@/lib/data/team';
import TeamMembersClient from './TeamMembersClient';

export default async function TeamPage() {
  // Fetch team members server-side
  const teamMembers = await getTeamMembers();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground mt-2">
          View team members, their expertise, and contributions.
        </p>
      </div>

      {/* Client Component handles interactivity */}
      <TeamMembersClient teamMembers={teamMembers} loading={false} />
    </div>
  );
}

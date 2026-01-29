import { requireAdminPage } from '@/lib/auth/authorization';
import { getActivities } from '@/lib/data/activities';
import { getTeamMembers } from '@/lib/data/team';
import { connectDB } from '@/lib/db/mongo';
import ActivityContribution from '@/models/ActivityContribution';
import { notFound } from 'next/navigation';
import EditActivityForm from './EditActivityForm';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditActivityPage({ params }: PageProps) {
  // Enforce admin-only access
  await requireAdminPage();

  const { id } = await params;

  // Fetch all activities and find the one being edited
  const activities = await getActivities();
  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    notFound();
  }

  // Fetch team members for member selection
  const teamMembers = await getTeamMembers();

  // Fetch activity contributors to pre-select members
  await connectDB();
  const contributions = await ActivityContribution.find({ activityId: id }).lean().exec();

  const activityMemberIds = contributions.map((c) => c.userId.toString());

  return (
    <EditActivityForm
      activity={activity}
      teamMembers={teamMembers}
      activityMemberIds={activityMemberIds}
    />
  );
}

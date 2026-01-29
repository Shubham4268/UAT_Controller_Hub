// ISG Configuration: Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

import { getActivities } from '@/lib/data/activities';
import ActivitiesClient from './ActivitiesClient';

export default async function ActivitiesPage() {
  // Fetch activities server-side
  const activities = await getActivities();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Activities</h1>
        <p className="text-muted-foreground mt-2">
          View team projects, initiatives, and key accomplishments.
        </p>
      </div>

      {/* Client Component handles interactivity */}
      <ActivitiesClient activities={activities} loading={false} />
    </div>
  );
}

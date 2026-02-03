import Link from 'next/link';
import { connectDB } from '@/lib/db/mongo';
import User from '@/models/User';
import TestSession from '@/models/TestSession';
import Issue from '@/models/Issue';

// Force dynamic rendering since we are fetching live data
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await connectDB();

  // 1. Summary Stats
  const [totalTeamMembers, totalActivities, totalIssuesFound] = await Promise.all([
    User.countDocuments(),
    TestSession.countDocuments(),
    Issue.countDocuments(),
  ]);

  const validatedIssues = await Issue.countDocuments({ status: 'VALIDATED' });
  // Calculate specific "Validation Rate" score
  const overallScore = totalIssuesFound > 0
    ? Math.round((validatedIssues / totalIssuesFound) * 100)
    : 0;

  // 2. Recent Activities (Sessions)
  const recentSessions = await TestSession.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentActivities = await Promise.all(
    recentSessions.map(async (session: any) => {
      const count = await Issue.countDocuments({ sessionId: session._id });
      return {
        id: session._id.toString(),
        title: session.title,
        description: session.description,
        metric: { label: 'Issues', value: count },
      };
    })
  );

  // 3. Top Contributors
  const topContributorsData = await Issue.aggregate([
    { $group: { _id: '$testerId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        id: '$_id',
        name: '$user.name',
        domain: '$user.role',
        count: '$count',
      },
    },
  ]);

  const topContributors = topContributorsData.map((c: any) => ({
    id: c.id.toString(),
    name: c.name,
    domain: c.domain.charAt(0).toUpperCase() + c.domain.slice(1), // Capitalize role
    metric: { label: 'Issues', value: c.count },
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of team performance and recent activity.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Team Members</p>
          <p className="text-4xl font-bold mt-2">{totalTeamMembers}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
          <p className="text-4xl font-bold mt-2">{totalActivities}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Issues Found</p>
          <p className="text-4xl font-bold mt-2">{totalIssuesFound}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Validation Rate</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-4xl font-bold">{overallScore}</p>
            <span className="text-sm text-muted-foreground font-medium">%</span>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activities</h2>
          <Link href="/activities" className="text-sm text-primary hover:underline">
            View all activities →
          </Link>
        </div>

        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 border rounded-lg bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{activity.metric.value}</p>
                    <p className="text-xs text-muted-foreground">{activity.metric.label}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm py-4">No activities found.</p>
          )}
        </div>
      </div>

      {/* Top Contributors Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Top Contributors</h2>
          <Link href="/team" className="text-sm text-primary hover:underline">
            View team →
          </Link>
        </div>

        <div className="space-y-3">
          {topContributors.length > 0 ? (
            topContributors.map((contributor) => (
              <div
                key={contributor.id}
                className="p-4 border rounded-lg bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{contributor.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{contributor.domain}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold">{contributor.metric.value}</p>
                    <p className="text-xs text-muted-foreground">{contributor.metric.label}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm py-4">No contributions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

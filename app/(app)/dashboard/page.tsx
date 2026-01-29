import Link from 'next/link';

// Mock data that aligns with Team and Activities pages
// In real implementation, this would be fetched from API
const dashboardData = {
  summary: {
    totalTeamMembers: 5,
    totalActivities: 6,
    totalIssuesFound: 90, // Sum of issues from activities with issue counts
    overallScore: 93, // Average score across all activities
  },
  recentActivities: [
    {
      id: '2',
      title: 'Security Audit Framework',
      description: 'Development of automated security testing framework for continuous compliance.',
      metric: { label: 'Issues Found', value: 47 },
    },
    {
      id: '3',
      title: 'Mobile Testing Standards',
      description: 'Established company-wide mobile testing standards and best practices.',
      metric: { label: 'Score', value: 92 },
    },
    {
      id: '6',
      title: 'Contract Testing Implementation',
      description: 'Implemented consumer-driven contract testing for microservices architecture.',
      metric: { label: 'Issues Found', value: 8 },
    },
  ],
  topContributors: [
    {
      id: '3',
      name: 'Emily Watson',
      domain: 'Security Testing',
      metric: { label: 'Issues', value: 312 },
    },
    {
      id: '1',
      name: 'Sarah Chen',
      domain: 'Performance Testing',
      metric: { label: 'Issues', value: 247 },
    },
    {
      id: '5',
      name: 'Lisa Anderson',
      domain: 'Mobile Testing',
      metric: { label: 'Score', value: 91 },
    },
  ],
};

export default function DashboardPage() {
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
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Team Members</p>
          <p className="text-4xl font-bold mt-2">{dashboardData.summary.totalTeamMembers}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
          <p className="text-4xl font-bold mt-2">{dashboardData.summary.totalActivities}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <p className="text-sm font-medium text-muted-foreground">Total Issues Found</p>
          <p className="text-4xl font-bold mt-2">{dashboardData.summary.totalIssuesFound}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
          <p className="text-4xl font-bold mt-2">{dashboardData.summary.overallScore}</p>
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
          {dashboardData.recentActivities.map((activity) => (
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
          ))}
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
          {dashboardData.topContributors.map((contributor) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}

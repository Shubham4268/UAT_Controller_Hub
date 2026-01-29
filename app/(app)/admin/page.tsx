import { requireAdminPage } from '@/lib/auth/authorization';
import { getTeamMembers } from '@/lib/data/team';
import { getActivities } from '@/lib/data/activities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, Clock } from 'lucide-react';

export default async function AdminOverviewPage() {
  // Enforce admin-only access
  await requireAdminPage();

  // Fetch data for summary cards
  const [teamMembers, activities] = await Promise.all([getTeamMembers(), getActivities()]);

  const totalMembers = teamMembers.length;
  const totalActivities = activities.length;
  const lastUpdated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of team members, activities, and system status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Team Members Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active members in the team</p>
          </CardContent>
        </Card>

        {/* Activities Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projects, initiatives, and accomplishments
            </p>
          </CardContent>
        </Card>

        {/* Last Updated Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{lastUpdated}</div>
            <p className="text-xs text-muted-foreground mt-1">Data refresh timestamp</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold mb-1">Manage Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Add, edit, or remove team members and update their metrics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold mb-1">Manage Activities</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and manage projects, initiatives, and team accomplishments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

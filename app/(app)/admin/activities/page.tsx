import { requireAdminPage } from '@/lib/auth/authorization';
import { getActivities } from '@/lib/data/activities';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil } from 'lucide-react';
import DeleteButton from './DeleteButton';

export default async function AdminActivitiesPage() {
  // Enforce admin-only access
  await requireAdminPage();

  // Fetch activities
  const activities = await getActivities();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activities Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage projects, initiatives, and team accomplishments
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/activities/add">
            <Plus className="h-4 w-4 mr-2" />
            Add New Activity
          </Link>
        </Button>
      </div>

      {/* Activities Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">Issues Found</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No activities found. Add your first activity to get started.
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell className="capitalize">{activity.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {activity.members.slice(0, 2).join(', ')}
                    {activity.members.length > 2 && ` +${activity.members.length - 2}`}
                  </TableCell>
                  <TableCell className="text-right">
                    {activity.issuesFound !== undefined ? activity.issuesFound : '—'}
                  </TableCell>
                  <TableCell className="text-right">{activity.score}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/activities/${activity.id}/edit`}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <DeleteButton activityId={activity.id} activityTitle={activity.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

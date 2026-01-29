import { requireAdminPage } from '@/lib/auth/authorization';
import { getTeamMembers } from '@/lib/data/team';
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

export default async function AdminTeamPage() {
  // Enforce admin-only access
  await requireAdminPage();

  // Fetch team members
  const teamMembers = await getTeamMembers();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage team members, roles, and metrics</p>
        </div>
        <Button asChild>
          <Link href="/admin/team/add">
            <Plus className="h-4 w-4 mr-2" />
            Add New Member
          </Link>
        </Button>
      </div>

      {/* Team Members Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="text-right">Issues Found</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No team members found. Add your first team member to get started.
                </TableCell>
              </TableRow>
            ) : (
              teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.domain}</TableCell>
                  <TableCell className="text-right">{member.issuesFound}</TableCell>
                  <TableCell className="text-right">{member.score}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/team/${member.id}/edit`}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <DeleteButton memberId={member.id} memberName={member.name} />
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

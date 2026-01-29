'use client';

import { useState } from 'react';
import { deleteTeamMember } from '@/app/actions/team.actions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

type DeleteButtonProps = {
  memberId: string;
  memberName: string;
};

export default function DeleteButton({ memberId, memberName }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteTeamMember({ id: memberId });

      if (!result.success) {
        setError(result.error || 'Failed to delete team member');
        setIsDeleting(false);
      }
      // On success, page will revalidate and member will disappear
    } catch (err) {
      setError('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
        <Trash2 className="h-4 w-4 mr-1" />
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}

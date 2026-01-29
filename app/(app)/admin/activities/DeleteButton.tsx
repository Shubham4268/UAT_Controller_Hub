'use client';

import { useState } from 'react';
import { deleteActivity } from '@/app/actions/activities.actions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

type DeleteButtonProps = {
  activityId: string;
  activityTitle: string;
};

export default function DeleteButton({ activityId, activityTitle }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (
      !confirm(`Are you sure you want to delete "${activityTitle}"? This action cannot be undone.`)
    ) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteActivity({ id: activityId });

      if (!result.success) {
        setError(result.error || 'Failed to delete activity');
        setIsDeleting(false);
      }
      // On success, page will revalidate and activity will disappear
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

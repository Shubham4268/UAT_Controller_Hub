'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createActivity, type CreateActivityInput } from '@/app/actions/activities.actions';
import type { TeamMemberData } from '@/lib/data/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AddActivityFormProps = {
  teamMembers: TeamMemberData[];
};

export default function AddActivityForm({ teamMembers }: AddActivityFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [category, setCategory] = useState<'project' | 'initiative' | 'extra'>('project');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    const issuesFoundValue = formData.get('issuesFound') as string;
    const issuesFound =
      issuesFoundValue && issuesFoundValue.trim() !== '' ? parseInt(issuesFoundValue) : undefined;

    const input: CreateActivityInput = {
      title: formData.get('title') as string,
      shortDescription: formData.get('shortDescription') as string,
      fullDescription: formData.get('fullDescription') as string,
      category,
      memberIds: selectedMembers,
      issuesFound,
      score: parseInt(formData.get('score') as string) || 0,
    };

    const result = await createActivity(input);

    if (result.success) {
      setSuccess(true);
      // Redirect to admin activities list after short delay
      setTimeout(() => {
        router.push('/admin/activities');
      }, 1500);
    } else {
      setError(result.error || 'Failed to create activity');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/activities"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Activities Management
        </Link>
        <h1 className="text-3xl font-bold">Add Activity</h1>
        <p className="text-muted-foreground mt-2">
          Create a new project, initiative, or accomplishment
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g., API Gateway Performance Optimization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="initiative">Initiative</SelectItem>
                <SelectItem value="extra">Extra/Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">
              Short Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="shortDescription"
              name="shortDescription"
              required
              rows={2}
              placeholder="Brief summary (shown in card view)"
              maxLength={150}
            />
            <p className="text-sm text-muted-foreground">Maximum 150 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullDescription">
              Full Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="fullDescription"
              name="fullDescription"
              required
              rows={5}
              placeholder="Detailed description of the activity, achievements, and impact"
            />
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Select team members who contributed to this activity
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2">No team members available</p>
            ) : (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => handleMemberToggle(member.id)}
                  />
                  <label
                    htmlFor={`member-${member.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {member.name}
                  </label>
                </div>
              ))
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Metrics</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuesFound">Issues Found (Optional)</Label>
              <Input
                id="issuesFound"
                name="issuesFound"
                type="number"
                min="0"
                placeholder="Leave empty if not applicable"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">
                Impact Score <span className="text-destructive">*</span>
              </Label>
              <Input
                id="score"
                name="score"
                type="number"
                required
                min="0"
                max="100"
                defaultValue="85"
                placeholder="0-100"
              />
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 border border-green-600 bg-green-50 text-green-700 rounded-lg">
            Activity created successfully! Redirecting...
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={isSubmitting || success}>
            {isSubmitting ? 'Creating...' : 'Create Activity'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href="/admin/activities">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

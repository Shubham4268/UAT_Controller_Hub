'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTeamMember, type UpdateTeamMemberInput } from '@/app/actions/team.actions';
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
import { ImageUpload } from '@/components/common/ImageUpload';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type EditTeamMemberFormProps = {
  member: TeamMemberData;
};

export default function EditTeamMemberForm({ member }: EditTeamMemberFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [teamRole, setTeamRole] = useState(member.teamRole || 'Team Member');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    // Parse projects, courses, and skills from textarea (one per line)
    const parseTextarea = (value: string): string[] => {
      return value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    };

    const input: UpdateTeamMemberInput = {
      id: member.id,
      name: formData.get('name') as string,
      jobTitle: formData.get('jobTitle') as string,
      teamRole: formData.get('teamRole') as string,
      image: formData.get('image') as string,
      domain: formData.get('domain') as string,
      // Handle disabled inputs
      issuesFound: formData.get('issuesFound')
        ? parseInt(formData.get('issuesFound') as string)
        : undefined,
      score: formData.get('score') ? parseInt(formData.get('score') as string) : undefined,
      projects: parseTextarea((formData.get('projects') as string) || ''),
      courses: parseTextarea((formData.get('courses') as string) || ''),
      skills: parseTextarea((formData.get('skills') as string) || ''),
      department: (formData.get('department') as string) || undefined,
    };

    const result = await updateTeamMember(input);

    if (result.success) {
      setSuccess(true);
      // Redirect to admin team list after short delay
      setTimeout(() => {
        router.push('/admin/team');
      }, 1500);
    } else {
      setError(result.error || 'Failed to update team member');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/team"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Team Management
        </Link>
        <h1 className="text-3xl font-bold">Edit Team Member</h1>
        <p className="text-muted-foreground mt-2">Update team member information</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={member.name} />
          </div>
        </div>

        {/* Role & Domain */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Role & Domain</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamRole">
                Team Role <span className="text-destructive">*</span>
              </Label>
              <input type="hidden" name="teamRole" value={teamRole} />
              <Select value={teamRole} onValueChange={setTeamRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                  <SelectItem value="Team Lead">Team Lead</SelectItem>
                  <SelectItem value="Program Manager">Program Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                placeholder="e.g., Associate QA"
                defaultValue={member.role}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">
              Domain/Specialty <span className="text-destructive">*</span>
            </Label>
            <Input id="domain" name="domain" required defaultValue={member.domain} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Input id="department" name="department" defaultValue={member.domain} />
          </div>

          <div className="space-y-2">
            <Label>Profile Picture (Optional)</Label>
            <ImageUpload name="image" defaultValue={member.imageUrl} />
          </div>
        </div>

        {/* Metrics - Disabled for Program Manager */}
        <div className={teamRole === 'Program Manager' ? 'opacity-50 pointer-events-none' : ''}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold">Metrics</h2>
              {teamRole === 'Program Manager' && (
                <span className="text-xs text-muted-foreground uppercase font-medium">
                  Disabled for Program Manager
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuesFound">
                  Issues Found{' '}
                  {teamRole !== 'Program Manager' && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="issuesFound"
                  name="issuesFound"
                  type="number"
                  required={teamRole !== 'Program Manager'}
                  disabled={teamRole === 'Program Manager'}
                  min="0"
                  defaultValue={member.issuesFound}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">
                  Quality Score{' '}
                  {teamRole !== 'Program Manager' && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  required={teamRole !== 'Program Manager'}
                  disabled={teamRole === 'Program Manager'}
                  min="0"
                  max="100"
                  defaultValue={member.score}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Experience - Disabled for Program Manager */}
        <div className={teamRole === 'Program Manager' ? 'opacity-50 pointer-events-none' : ''}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold">Skills & Experience</h2>
              {teamRole === 'Program Manager' && (
                <span className="text-xs text-muted-foreground uppercase font-medium">
                  Disabled for Program Manager
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (one per line)</Label>
              <Textarea
                id="skills"
                name="skills"
                rows={4}
                defaultValue={member.skills?.join('\n') || ''}
                disabled={teamRole === 'Program Manager'}
                placeholder="e.g.,&#10;API Testing&#10;Performance Testing&#10;Test Automation"
              />
              <p className="text-sm text-muted-foreground">Note: Skills data from profile.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projects">Projects (one per line)</Label>
              <Textarea
                id="projects"
                name="projects"
                rows={4}
                disabled={teamRole === 'Program Manager'}
                defaultValue={member.projects.join('\n')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courses">Courses/Training (one per line)</Label>
              <Textarea
                id="courses"
                name="courses"
                rows={4}
                disabled={teamRole === 'Program Manager'}
                defaultValue={member.courses.join('\n')}
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
            Team member updated successfully! Redirecting...
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={isSubmitting || success}>
            {isSubmitting ? 'Updating...' : 'Update Team Member'}
          </Button>
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href="/admin/team">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

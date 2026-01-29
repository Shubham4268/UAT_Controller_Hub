import { connectDB } from '@/lib/db/mongo';
import User from '@/models/User';
import TeamMemberProfile from '@/models/TeamMemberProfile';
import MetricValue from '@/models/MetricValue';
import Metric from '@/models/Metric';

// Type for team member data returned to UI
export type TeamMemberData = {
  id: string;
  name: string;
  role: string; // This will now reflect jobTitle
  teamRole?: string; // "Program Manager", "Team Lead", "Team Member"
  domain: string;
  issuesFound: number;
  score: number;
  projects: string[];
  courses: string[];
  skills?: string[];
  systemRole?: string;
  imageUrl?: string; // Optional Cloudinary URL for avatar
};

/**
 * Fetch all team members with their profiles and metrics
 * READ-ONLY operation
 */
export async function getTeamMembers(): Promise<TeamMemberData[]> {
  try {
    await connectDB();

    // Fetch all active users with their profiles
    const users = await User.find({ archivedAt: { $exists: false } })
      .lean()
      .exec();

    if (!users || users.length === 0) {
      return [];
    }

    const teamMembers: TeamMemberData[] = [];

    for (const user of users) {
      // Get profile for additional info
      const profile = await TeamMemberProfile.findOne({ userId: user._id }).lean().exec();

      // Get metrics for this user
      const metrics = await MetricValue.find({
        entityId: user._id,
        entityType: 'User',
      })
        .populate('metricId')
        .lean()
        .exec();

      // Extract issues found and score from metrics
      let issuesFound = 0;
      let score = 0;

      for (const metric of metrics) {
        const metricName = (metric.metricId as any)?.name?.toLowerCase();
        const value = typeof metric.value === 'number' ? metric.value : 0;

        if (metricName?.includes('issue') || metricName?.includes('bug')) {
          issuesFound += value;
        } else if (metricName?.includes('score') || metricName?.includes('quality')) {
          score = Math.max(score, value);
        }
      }

      // Mock projects and courses from profile skills or metadata
      const projects = profile?.skills?.slice(0, 3).map((skill) => `${skill} Project`) || [
        'Project work pending',
      ];

      const courses = profile?.skills?.slice(0, 3).map((skill) => `${skill} Training`) || [
        'Training pending',
      ];

      // Determine Role/Job Title
      // Use cached job Title if available, otherwise fallback
      const jobTitle = profile?.jobTitle || (user.role === 'admin' ? 'QA Lead' : 'QA Engineer');
      const teamRole = profile?.teamRole || 'Team Member';

      teamMembers.push({
        id: user._id.toString(),
        name: user.name,
        role: jobTitle,
        teamRole,
        domain: profile?.department || profile?.skills?.[0] || 'General Testing',
        issuesFound,
        score,
        projects,
        courses,
        skills: profile?.skills || [],
        systemRole: user.role,
        imageUrl: user.image, // Optional Cloudinary URL
      });
    }

    return teamMembers;
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

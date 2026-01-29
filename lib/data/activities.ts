import { connectDB } from '@/lib/db/mongo';
import Activity from '@/models/Activity';
import ActivityContribution from '@/models/ActivityContribution';
import User from '@/models/User';
import MetricValue from '@/models/MetricValue';

// Type for activity data returned to UI
export type ActivityData = {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  members: string[];
  issuesFound?: number;
  score: number;
  category: 'project' | 'initiative' | 'extra';
  imageUrl?: string; // Optional Cloudinary URL
};

/**
 * Fetch all activities with contributors and metrics
 * READ-ONLY operation
 */
export async function getActivities(): Promise<ActivityData[]> {
  try {
    await connectDB();

    // Fetch all non-archived activities
    const activities = await Activity.find({ archivedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!activities || activities.length === 0) {
      return [];
    }

    const activityList: ActivityData[] = [];

    for (const activity of activities) {
      // Get contributors for this activity
      const contributions = await ActivityContribution.find({ activityId: activity._id })
        .populate('userId')
        .lean()
        .exec();

      const memberNames = contributions.map((contrib: any) => contrib.userId?.name).filter(Boolean);

      // Get metrics for this activity
      const metrics = await MetricValue.find({
        entityId: activity._id,
        entityType: 'Activity',
      })
        .populate('metricId')
        .lean()
        .exec();

      // Extract issues found and score from metrics
      let issuesFound: number | undefined = undefined;
      let score = 85; // Default score

      for (const metric of metrics) {
        const metricName = (metric.metricId as any)?.name?.toLowerCase();
        const value = typeof metric.value === 'number' ? metric.value : 0;

        if (metricName?.includes('issue') || metricName?.includes('bug')) {
          issuesFound = (issuesFound || 0) + value;
        } else if (metricName?.includes('score') || metricName?.includes('impact')) {
          score = Math.max(score, value);
        }
      }

      // Map activity type to category
      let category: 'project' | 'initiative' | 'extra';
      if (activity.type === 'project' || activity.type === 'milestone') {
        category = 'project';
      } else if (activity.type === 'task') {
        category = 'initiative';
      } else {
        category = 'extra';
      }

      activityList.push({
        id: activity._id.toString(),
        title: activity.title,
        shortDescription: activity.description?.substring(0, 150) || 'No description available',
        fullDescription: activity.description || 'No detailed description available',
        members: memberNames.length > 0 ? memberNames : ['Unassigned'],
        issuesFound,
        score,
        category,
        imageUrl: activity.image, // Optional Cloudinary URL
      });
    }

    return activityList;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

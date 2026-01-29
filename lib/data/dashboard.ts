import { connectDB } from '@/lib/db/mongo';
import User from '@/models/User';
import Activity from '@/models/Activity';
import MetricValue from '@/models/MetricValue';

// Type for dashboard summary data
export type DashboardSummary = {
  totalTeamMembers: number;
  totalActivities: number;
  totalIssuesFound: number;
  overallScore: number;
};

// Type for recent activity preview
export type RecentActivityPreview = {
  id: string;
  title: string;
  description: string;
  metric: { label: string; value: number };
};

// Type for top contributor preview
export type TopContributorPreview = {
  id: string;
  name: string;
  domain: string;
  metric: { label: string; value: number };
};

/**
 * Fetch dashboard summary metrics
 * READ-ONLY aggregation
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    await connectDB();

    // Count active team members
    const totalTeamMembers = await User.countDocuments({
      archivedAt: { $exists: false },
    });

    // Count active activities
    const totalActivities = await Activity.countDocuments({
      archivedAt: { $exists: false },
    });

    // Aggregate total issues from all activity metrics
    const issueMetrics = await MetricValue.find({
      entityType: 'Activity',
    })
      .populate('metricId')
      .lean()
      .exec();

    let totalIssuesFound = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    for (const metric of issueMetrics) {
      const metricName = (metric.metricId as any)?.name?.toLowerCase();
      const value = typeof metric.value === 'number' ? metric.value : 0;

      if (metricName?.includes('issue') || metricName?.includes('bug')) {
        totalIssuesFound += value;
      } else if (metricName?.includes('score') || metricName?.includes('impact')) {
        scoreSum += value;
        scoreCount++;
      }
    }

    const overallScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 90;

    return {
      totalTeamMembers,
      totalActivities,
      totalIssuesFound,
      overallScore,
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      totalTeamMembers: 0,
      totalActivities: 0,
      totalIssuesFound: 0,
      overallScore: 0,
    };
  }
}

/**
 * Fetch recent activities for dashboard preview
 * READ-ONLY operation
 */
export async function getRecentActivitiesPreview(): Promise<RecentActivityPreview[]> {
  try {
    await connectDB();

    const activities = await Activity.find({ archivedAt: { $exists: false } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()
      .exec();

    const previews: RecentActivityPreview[] = [];

    for (const activity of activities) {
      // Get metrics for this activity
      const metrics = await MetricValue.find({
        entityId: activity._id,
        entityType: 'Activity',
      })
        .populate('metricId')
        .lean()
        .exec();

      let metricLabel = 'Score';
      let metricValue = 85;

      for (const metric of metrics) {
        const metricName = (metric.metricId as any)?.name?.toLowerCase();
        const value = typeof metric.value === 'number' ? metric.value : 0;

        if (metricName?.includes('issue')) {
          metricLabel = 'Issues Found';
          metricValue = value;
          break;
        } else if (metricName?.includes('score')) {
          metricLabel = 'Score';
          metricValue = value;
        }
      }

      previews.push({
        id: activity._id.toString(),
        title: activity.title,
        description: activity.description?.substring(0, 100) || 'No description',
        metric: { label: metricLabel, value: metricValue },
      });
    }

    return previews;
  } catch (error) {
    console.error('Error fetching recent activities preview:', error);
    return [];
  }
}

/**
 * Fetch top contributors for dashboard preview
 * READ-ONLY operation
 */
export async function getTopContributorsPreview(): Promise<TopContributorPreview[]> {
  try {
    await connectDB();

    const users = await User.find({ archivedAt: { $exists: false } })
      .limit(3)
      .lean()
      .exec();

    const contributors: TopContributorPreview[] = [];

    for (const user of users) {
      // Get metrics for this user
      const metrics = await MetricValue.find({
        entityId: user._id,
        entityType: 'User',
      })
        .populate('metricId')
        .lean()
        .exec();

      let metricLabel = 'Issues';
      let metricValue = 0;

      for (const metric of metrics) {
        const metricName = (metric.metricId as any)?.name?.toLowerCase();
        const value = typeof metric.value === 'number' ? metric.value : 0;

        if (metricName?.includes('issue')) {
          metricLabel = 'Issues';
          metricValue += value;
        } else if (metricName?.includes('score')) {
          if (metricLabel !== 'Issues') {
            metricLabel = 'Score';
            metricValue = Math.max(metricValue, value);
          }
        }
      }

      contributors.push({
        id: user._id.toString(),
        name: user.name,
        domain: 'Testing', // Would come from TeamMemberProfile
        metric: { label: metricLabel, value: metricValue },
      });
    }

    return contributors;
  } catch (error) {
    console.error('Error fetching top contributors preview:', error);
    return [];
  }
}

import { NextResponse } from 'next/server';
import {
  getDashboardSummary,
  getRecentActivitiesPreview,
  getTopContributorsPreview,
} from '@/lib/data/dashboard';

export async function GET() {
  try {
    const [summary, recentActivities, topContributors] = await Promise.all([
      getDashboardSummary(),
      getRecentActivitiesPreview(),
      getTopContributorsPreview(),
    ]);

    return NextResponse.json({
      summary,
      recentActivities,
      topContributors,
    });
  } catch (error) {
    console.error('API error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

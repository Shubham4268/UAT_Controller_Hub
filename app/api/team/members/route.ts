import { NextResponse } from 'next/server';
import { getTeamMembers } from '@/lib/data/team';

export async function GET() {
  try {
    const teamMembers = await getTeamMembers();
    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('API error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}
